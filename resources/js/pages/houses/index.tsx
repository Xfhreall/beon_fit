import { Head, router } from '@inertiajs/react';
import { useForm as useTanStackForm } from '@tanstack/react-form';
import { Edit, Plus, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    assignResident,
    destroy,
    endOccupancy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/HouseController';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
    FieldError,
    compareSortValue,
    formatWibDateTime,
    nextSort,
    Pagination,
    requiredField,
    SortableTableHead,
    StatusBadge,
} from '../rt-finance/shared';

type Resident = { id: number; name: string; resident_status: string };
type Occupancy = {
    id: number;
    resident?: Resident;
    started_at: string;
    ended_at: string | null;
    resident_status: string;
    is_active: boolean;
};
type House = {
    id: number;
    number: string;
    block: string | null;
    status: string;
    notes: string | null;
    active_occupancies: Occupancy[];
    occupancies: Occupancy[];
    unpaid_bills_count: number;
    created_at?: string;
    updated_at?: string;
};
type HouseSortKey = 'number' | 'block' | 'status' | 'resident' | 'unpaid';
type HouseFormData = {
    number: string;
    block: string;
    status: string;
    notes: string;
};
type OccupancyFormData = {
    resident_id: string;
    started_at: string;
    ended_at: string;
    resident_status: string;
};

const houseFormDefaults: HouseFormData = {
    number: '',
    block: '',
    status: 'tidak_dihuni',
    notes: '',
};

function occupancyFormDefaults(): OccupancyFormData {
    return {
        resident_id: '',
        started_at: new Date().toISOString().slice(0, 10),
        ended_at: '',
        resident_status: 'tetap',
    };
}

export default function HousesIndex({
    houses,
    residents,
    filters,
}: {
    houses: Paginated<House>;
    residents: Resident[];
    filters: Record<string, string>;
}) {
    const [editing, setEditing] = useState<House | null>(null);
    const [assigning, setAssigning] = useState<House | null>(null);
    const [ending, setEnding] = useState<{
        house: House;
        occupancy: Occupancy;
    } | null>(null);
    const [detail, setDetail] = useState<House | null>(null);
    const [open, setOpen] = useState(false);
    const [sort, setSort] = useState<SortState<HouseSortKey>>({
        key: 'number',
        direction: 'asc',
    });
    const [houseProcessing, setHouseProcessing] = useState(false);
    const [occupancyProcessing, setOccupancyProcessing] = useState(false);
    const form = useTanStackForm({
        defaultValues: houseFormDefaults,
        onSubmit: ({ value }) => submitHouse(value),
    });
    const occupancyForm = useTanStackForm({
        defaultValues: occupancyFormDefaults(),
        onSubmit: ({ value }) => submitOccupancy(value),
    });
    const sortedHouses = useMemo(() => {
        return [...houses.data].sort((a, b) => {
            const values: Record<HouseSortKey, string | number> = {
                number: a.number,
                block: a.block ?? '',
                status: a.status,
                resident: a.active_occupancies[0]?.resident?.name ?? '',
                unpaid: a.unpaid_bills_count,
            };
            const otherValues: Record<HouseSortKey, string | number> = {
                number: b.number,
                block: b.block ?? '',
                status: b.status,
                resident: b.active_occupancies[0]?.resident?.name ?? '',
                unpaid: b.unpaid_bills_count,
            };
            const result = compareSortValue(
                values[sort.key],
                otherValues[sort.key],
            );

            return sort.direction === 'asc' ? result : -result;
        });
    }, [houses.data, sort]);

    function submitHouse(value: HouseFormData) {
        const options = {
            preserveScroll: true,
            onStart: () => setHouseProcessing(true),
            onFinish: () => setHouseProcessing(false),
            onSuccess: () => setOpen(false),
        };

        if (editing) {
            router.patch(update.url(editing.id), value, options);

            return;
        }

        router.post(store.url(), value, options);
    }

    function submitOccupancy(value: OccupancyFormData) {
        if (!assigning) {
            return;
        }

        router.post(assignResident.url(assigning.id), value, {
            preserveScroll: true,
            onStart: () => setOccupancyProcessing(true),
            onFinish: () => setOccupancyProcessing(false),
            onSuccess: () => setAssigning(null),
        });
    }

    function startEdit(house: House) {
        setEditing(house);
        form.reset({
            number: house.number,
            block: house.block ?? '',
            status: house.status,
            notes: house.notes ?? '',
        });
        setOpen(true);
    }

    return (
        <>
            <Head title="Rumah" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Rumah</h1>
                        <p className="text-sm text-muted-foreground">
                            Status hunian dan riwayat penghuni.
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => {
                                    setEditing(null);
                                    form.reset(houseFormDefaults);
                                }}
                            >
                                <Plus className="size-4" />
                                Tambah
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void form.handleSubmit();
                                }}
                                className="grid gap-4"
                            >
                                <DialogHeader>
                                    <DialogTitle>
                                        {editing
                                            ? 'Ubah rumah'
                                            : 'Tambah rumah'}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-3">
                                    <form.Field
                                        name="number"
                                        validators={{
                                            onBlur: requiredField(
                                                'Nomor rumah',
                                            ),
                                            onChange: requiredField(
                                                'Nomor rumah',
                                            ),
                                        }}
                                    >
                                        {(field) => (
                                            <div className="grid gap-2">
                                                <Label htmlFor={field.name}>
                                                    Nomor rumah
                                                </Label>
                                                <Input
                                                    id={field.name}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(event) =>
                                                        field.handleChange(
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <FieldError
                                                    errors={
                                                        field.state.meta.errors
                                                    }
                                                />
                                            </div>
                                        )}
                                    </form.Field>
                                    <div className="grid gap-2">
                                        <Label>Blok</Label>
                                        <form.Field name="block">
                                            {(field) => (
                                                <Input
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(event) =>
                                                        field.handleChange(
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            )}
                                        </form.Field>
                                    </div>
                                    <form.Field name="status">
                                        {(field) => (
                                            <div className="grid gap-2">
                                                <Label>Status</Label>
                                                <Select
                                                    value={field.state.value}
                                                    onValueChange={
                                                        field.handleChange
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="dihuni">
                                                            Dihuni
                                                        </SelectItem>
                                                        <SelectItem value="tidak_dihuni">
                                                            Tidak dihuni
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </form.Field>
                                </div>
                                <DialogFooter>
                                    <form.Subscribe
                                        selector={(state) => ({
                                            canSubmit: state.canSubmit,
                                            isSubmitting: state.isSubmitting,
                                        })}
                                    >
                                        {({ canSubmit, isSubmitting }) => (
                                            <Button
                                                type="submit"
                                                disabled={
                                                    !canSubmit ||
                                                    isSubmitting ||
                                                    houseProcessing
                                                }
                                            >
                                                {houseProcessing
                                                    ? 'Menyimpan...'
                                                    : 'Simpan'}
                                            </Button>
                                        )}
                                    </form.Subscribe>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar rumah</CardTitle>
                        <DebouncedSearchInput
                            url={index.url()}
                            filters={filters}
                            placeholder="Cari nomor / blok"
                        />
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableTableHead
                                        sortKey="number"
                                        sort={sort}
                                        onSort={(key) =>
                                            setSort(nextSort(sort, key))
                                        }
                                    >
                                        Nomor
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="block"
                                        sort={sort}
                                        onSort={(key) =>
                                            setSort(nextSort(sort, key))
                                        }
                                    >
                                        Blok
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
                                        sortKey="resident"
                                        sort={sort}
                                        onSort={(key) =>
                                            setSort(nextSort(sort, key))
                                        }
                                    >
                                        Penghuni aktif
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="unpaid"
                                        sort={sort}
                                        onSort={(key) =>
                                            setSort(nextSort(sort, key))
                                        }
                                    >
                                        Tunggakan
                                    </SortableTableHead>
                                    <TableHead className="text-right">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {houses.data.length === 0 ? (
                                    <EmptyRow colSpan={6} />
                                ) : (
                                    sortedHouses.map((house) => {
                                        const active =
                                            house.active_occupancies[0];

                                        return (
                                            <TableRow
                                                key={house.id}
                                                className="cursor-pointer"
                                                onClick={() => setDetail(house)}
                                            >
                                                <TableCell>
                                                    {house.number}
                                                </TableCell>
                                                <TableCell>
                                                    {house.block ?? '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        value={house.status}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {active?.resident?.name ??
                                                        '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {house.unpaid_bills_count}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            size="icon-sm"
                                                            variant="ghost"
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                event.stopPropagation();
                                                                startEdit(
                                                                    house,
                                                                );
                                                            }}
                                                        >
                                                            <Edit className="size-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon-sm"
                                                            variant="ghost"
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                event.stopPropagation();
                                                                setAssigning(
                                                                    house,
                                                                );
                                                            }}
                                                        >
                                                            <UserPlus className="size-4" />
                                                        </Button>
                                                        {active && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={(
                                                                    event,
                                                                ) => {
                                                                    event.stopPropagation();
                                                                    setEnding({
                                                                        house,
                                                                        occupancy:
                                                                            active,
                                                                    });
                                                                }}
                                                            >
                                                                Akhiri
                                                            </Button>
                                                        )}
                                                        <ConfirmDeleteButton
                                                            title="Hapus rumah?"
                                                            description={`Rumah ${house.number} akan dihapus dari data.`}
                                                            onConfirm={() =>
                                                                router.delete(
                                                                    destroy.url(
                                                                        house.id,
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
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                        <Pagination links={houses.links} />
                    </CardContent>
                </Card>

                <Dialog
                    open={assigning !== null}
                    onOpenChange={(value) => !value && setAssigning(null)}
                >
                    <DialogContent>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                void occupancyForm.handleSubmit();
                            }}
                            className="grid gap-4"
                        >
                            <DialogHeader>
                                <DialogTitle>Tetapkan penghuni</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-3">
                                <occupancyForm.Field
                                    name="resident_id"
                                    validators={{
                                        onBlur: requiredField('Penghuni'),
                                        onChange: requiredField('Penghuni'),
                                    }}
                                >
                                    {(field) => (
                                        <div className="grid gap-2">
                                            <Label>Penghuni</Label>
                                            <Select
                                                value={field.state.value}
                                                onValueChange={
                                                    field.handleChange
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Pilih penghuni" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {residents.map(
                                                        (resident) => (
                                                            <SelectItem
                                                                key={
                                                                    resident.id
                                                                }
                                                                value={String(
                                                                    resident.id,
                                                                )}
                                                            >
                                                                {resident.name}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FieldError
                                                errors={
                                                    field.state.meta.errors
                                                }
                                            />
                                        </div>
                                    )}
                                </occupancyForm.Field>
                                <occupancyForm.Field
                                    name="started_at"
                                    validators={{
                                        onBlur: requiredField('Mulai tinggal'),
                                        onChange:
                                            requiredField('Mulai tinggal'),
                                    }}
                                >
                                    {(field) => (
                                        <div className="grid gap-2">
                                            <Label>Mulai tinggal</Label>
                                            <Input
                                                type="date"
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(event) =>
                                                    field.handleChange(
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <FieldError
                                                errors={
                                                    field.state.meta.errors
                                                }
                                            />
                                        </div>
                                    )}
                                </occupancyForm.Field>
                                <occupancyForm.Field name="resident_status">
                                    {(field) => (
                                        <div className="grid gap-2">
                                            <Label>Status saat tinggal</Label>
                                            <Select
                                                value={field.state.value}
                                                onValueChange={
                                                    field.handleChange
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
                                    )}
                                </occupancyForm.Field>
                            </div>
                            <DialogFooter>
                                <occupancyForm.Subscribe
                                    selector={(state) => ({
                                        canSubmit: state.canSubmit,
                                        isSubmitting: state.isSubmitting,
                                    })}
                                >
                                    {({ canSubmit, isSubmitting }) => (
                                        <Button
                                            type="submit"
                                            disabled={
                                                !canSubmit ||
                                                isSubmitting ||
                                                occupancyProcessing
                                            }
                                        >
                                            {occupancyProcessing
                                                ? 'Menyimpan...'
                                                : 'Simpan'}
                                        </Button>
                                    )}
                                </occupancyForm.Subscribe>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                <AlertDialog
                    open={ending !== null}
                    onOpenChange={(value) => !value && setEnding(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Akhiri masa tinggal?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {ending?.occupancy.resident?.name ?? 'Penghuni'}{' '}
                                akan diakhiri dari rumah{' '}
                                {ending?.house.number ?? '-'} per hari ini.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    if (!ending) {
                                        return;
                                    }

                                    router.patch(
                                        endOccupancy.url({
                                            house: ending.house.id,
                                            occupancy: ending.occupancy.id,
                                        }),
                                        {},
                                        { preserveScroll: true },
                                    );
                                    setEnding(null);
                                }}
                            >
                                Akhiri
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                {detail && (
                    <DetailDialog
                        title={`Rumah ${detail.number}`}
                        open={detail !== null}
                        onOpenChange={(value) => !value && setDetail(null)}
                        fields={[
                            ['Nomor', detail.number],
                            ['Blok', detail.block ?? '-'],
                            ['Status', <StatusBadge value={detail.status} />],
                            [
                                'Penghuni aktif',
                                detail.active_occupancies[0]?.resident?.name ??
                                    '-',
                            ],
                            ['Tunggakan', detail.unpaid_bills_count],
                            ['Dibuat', formatWibDateTime(detail.created_at)],
                            ['Diubah', formatWibDateTime(detail.updated_at)],
                        ]}
                    />
                )}
            </div>
        </>
    );
}
