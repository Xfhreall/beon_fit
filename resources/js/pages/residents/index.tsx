import { Head, router, useForm } from '@inertiajs/react';
import { Edit, ImageIcon, Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/ResidentController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Paginated, SortState } from '../rt-finance/shared';
import {
    ConfirmDeleteButton,
    DebouncedSearchInput,
    DetailDialog,
    EmptyRow,
    formatWibDateTime,
    ImageInput,
    nextSort,
    Pagination,
    SortableTableHead,
    StatusBadge,
    compareSortValue,
} from '../rt-finance/shared';

type Resident = {
    id: number;
    name: string;
    phone: string;
    resident_status: string;
    marital_status: string;
    active_occupancies: { house?: { number: string } }[];
    ktp_photo_url?: string | null;
    created_at?: string;
    updated_at?: string;
};

type FormData = {
    name: string;
    phone: string;
    resident_status: string;
    marital_status: string;
    ktp_photo: File | null;
};

type ResidentSortKey = 'name' | 'phone' | 'status' | 'marital' | 'house';

const residentFormDefaults: FormData = {
    name: '',
    phone: '',
    resident_status: 'tetap',
    marital_status: 'menikah',
    ktp_photo: null,
};

export default function ResidentsIndex({
    residents,
    filters,
}: {
    residents: Paginated<Resident>;
    filters: Record<string, string>;
}) {
    const [editing, setEditing] = useState<Resident | null>(null);
    const [detail, setDetail] = useState<Resident | null>(null);
    const [ktpPreview, setKtpPreview] = useState<Resident | null>(null);
    const [open, setOpen] = useState(false);
    const [sort, setSort] = useState<SortState<ResidentSortKey>>({
        key: 'name',
        direction: 'asc',
    });
    const form = useForm<FormData>(residentFormDefaults);

    const sortedResidents = useMemo(() => {
        return [...residents.data].sort((a, b) => {
            const values: Record<ResidentSortKey, string | number> = {
                name: a.name,
                phone: a.phone,
                status: a.resident_status,
                marital: a.marital_status,
                house: a.active_occupancies[0]?.house?.number ?? '',
            };
            const otherValues: Record<ResidentSortKey, string | number> = {
                name: b.name,
                phone: b.phone,
                status: b.resident_status,
                marital: b.marital_status,
                house: b.active_occupancies[0]?.house?.number ?? '',
            };
            const result = compareSortValue(
                values[sort.key],
                otherValues[sort.key],
            );

            return sort.direction === 'asc' ? result : -result;
        });
    }, [residents.data, sort]);

    function submit(event: FormEvent) {
        event.preventDefault();

        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setOpen(false),
            onError: (errors: Record<string, string>) =>
                toast.error(
                    Object.values(errors)[0] ?? 'Gagal menyimpan penghuni.',
                ),
        };

        if (editing) {
            form.post(update.form.patch(editing.id).action, options);

            return;
        }

        form.post(store.url(), options);
    }

    function startEdit(resident: Resident) {
        setEditing(resident);
        form.setData({
            name: resident.name,
            phone: resident.phone,
            resident_status: resident.resident_status,
            marital_status: resident.marital_status,
            ktp_photo: null,
        });
        setOpen(true);
    }

    function startCreate() {
        setEditing(null);
        form.reset();
        form.setData('resident_status', 'tetap');
        form.setData('marital_status', 'menikah');
        setOpen(true);
    }

    return (
        <>
            <Head title="Penghuni" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Penghuni</h1>
                        <p className="text-sm text-muted-foreground">
                            Data warga, status, dan rumah aktif.
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={startCreate}>
                                <Plus className="size-4" />
                                Tambah
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                            <form onSubmit={submit} className="grid gap-4">
                                <DialogHeader>
                                    <DialogTitle>
                                        {editing
                                            ? 'Ubah penghuni'
                                            : 'Tambah penghuni'}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">
                                            Nama lengkap
                                        </Label>
                                        <Input
                                            id="name"
                                            value={form.data.name}
                                            onChange={(event) =>
                                                form.setData(
                                                    'name',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">
                                            Nomor telepon
                                        </Label>
                                        <Input
                                            id="phone"
                                            value={form.data.phone}
                                            onChange={(event) =>
                                                form.setData(
                                                    'phone',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Status penghuni</Label>
                                        <Select
                                            value={form.data.resident_status}
                                            onValueChange={(value) =>
                                                form.setData(
                                                    'resident_status',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="tetap">
                                                    Tetap
                                                </SelectItem>
                                                <SelectItem value="kontrak">
                                                    Kontrak
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Status pernikahan</Label>
                                        <Select
                                            value={form.data.marital_status}
                                            onValueChange={(value) =>
                                                form.setData(
                                                    'marital_status',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="menikah">
                                                    Menikah
                                                </SelectItem>
                                                <SelectItem value="belum_menikah">
                                                    Belum menikah
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <ImageInput
                                            name="ktp_photo"
                                            label="Preview KTP"
                                            onFile={(file) =>
                                                form.setData('ktp_photo', file)
                                            }
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                    >
                                        {form.processing
                                            ? 'Menyimpan...'
                                            : 'Simpan'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar penghuni</CardTitle>
                        <div className="flex flex-wrap gap-2">
                            <DebouncedSearchInput
                                url={index.url()}
                                filters={filters}
                                placeholder="Cari nama / telepon"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableTableHead
                                        sortKey="name"
                                        sort={sort}
                                        onSort={(key) =>
                                            setSort(nextSort(sort, key))
                                        }
                                    >
                                        Nama
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="phone"
                                        sort={sort}
                                        onSort={(key) =>
                                            setSort(nextSort(sort, key))
                                        }
                                    >
                                        Telepon
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="status"
                                        sort={sort}
                                        onSort={(key) =>
                                            setSort(nextSort(sort, key))
                                        }
                                    >
                                        Status
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="marital"
                                        sort={sort}
                                        onSort={(key) =>
                                            setSort(nextSort(sort, key))
                                        }
                                    >
                                        Pernikahan
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="house"
                                        sort={sort}
                                        onSort={(key) =>
                                            setSort(nextSort(sort, key))
                                        }
                                    >
                                        Rumah aktif
                                    </SortableTableHead>
                                    <TableHead>KTP</TableHead>
                                    <TableHead className="text-right">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {residents.data.length === 0 ? (
                                    <EmptyRow colSpan={7} />
                                ) : (
                                    sortedResidents.map((resident) => (
                                        <TableRow
                                            key={resident.id}
                                            className="cursor-pointer"
                                            onClick={() => setDetail(resident)}
                                        >
                                            <TableCell>
                                                {resident.name}
                                            </TableCell>
                                            <TableCell>
                                                {resident.phone}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    value={
                                                        resident.resident_status
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {resident.marital_status.replace(
                                                    '_',
                                                    ' ',
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {resident.active_occupancies[0]
                                                    ?.house?.number ?? '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={
                                                        !resident.ktp_photo_url
                                                    }
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setKtpPreview(resident);
                                                    }}
                                                >
                                                    <ImageIcon className="size-4" />
                                                    Lihat
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        size="icon-sm"
                                                        variant="ghost"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            startEdit(resident);
                                                        }}
                                                    >
                                                        <Edit className="size-4" />
                                                    </Button>
                                                    <ConfirmDeleteButton
                                                        title="Hapus penghuni?"
                                                        description={`Data ${resident.name} akan dihapus beserta relasi hunian aktifnya.`}
                                                        onConfirm={() =>
                                                            router.delete(
                                                                destroy.url(
                                                                    resident.id,
                                                                ),
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <Pagination
                            links={residents.links}
                            perPage={residents.per_page}
                        />
                    </CardContent>
                </Card>
                {detail && (
                    <DetailDialog
                        title={detail.name}
                        open={detail !== null}
                        onOpenChange={(value) => !value && setDetail(null)}
                        fields={[
                            ['Nama', detail.name],
                            ['Telepon', detail.phone],
                            [
                                'Status penghuni',
                                <StatusBadge value={detail.resident_status} />,
                            ],
                            [
                                'Status pernikahan',
                                detail.marital_status.replace('_', ' '),
                            ],
                            [
                                'Rumah aktif',
                                detail.active_occupancies[0]?.house?.number ??
                                    '-',
                            ],
                            [
                                'KTP',
                                detail.ktp_photo_url ? 'Tersedia' : 'Belum ada',
                            ],
                            ['Dibuat', formatWibDateTime(detail.created_at)],
                            ['Diubah', formatWibDateTime(detail.updated_at)],
                        ]}
                    />
                )}
                <Dialog
                    open={ktpPreview !== null}
                    onOpenChange={(value) => !value && setKtpPreview(null)}
                >
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                KTP {ktpPreview?.name ?? ''}
                            </DialogTitle>
                        </DialogHeader>
                        {ktpPreview?.ktp_photo_url && (
                            <img
                                src={ktpPreview.ktp_photo_url}
                                alt={`KTP ${ktpPreview.name}`}
                                className="max-h-[70vh] w-full rounded-lg object-contain"
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
