import { Head, router, useForm } from '@inertiajs/react';
import { Plus, RefreshCw } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import BillGenerationController from '@/actions/App/Http/Controllers/BillGenerationController';
import {
    destroy,
    store,
} from '@/actions/App/Http/Controllers/PaymentController';
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
import type { Paginated } from '../rt-finance/shared';
import {
    ConfirmDeleteButton,
    DetailDialog,
    EmptyRow,
    formatWibDateTime,
    money,
    Pagination,
    period,
    StatusBadge,
} from '../rt-finance/shared';

type FeeType = { id: number; name: string; amount: number };
type House = {
    id: number;
    number: string;
    active_occupancies: { resident?: { id: number; name: string } }[];
};
type Resident = {
    id: number;
    name: string;
    active_occupancies: { house?: { id: number; number: string } }[];
};
type Payment = {
    id: number;
    paid_at: string;
    amount: number;
    months_paid: number;
    payment_method?: string | null;
    notes?: string | null;
    house: { number: string };
    resident: { name: string };
    fee_type: { name: string };
};
type Bill = {
    id: number;
    period_month: number;
    period_year: number;
    amount_due: number;
    amount_paid: number;
    status: string;
    house: { number: string };
    resident?: { name: string };
    fee_type: { name: string };
};

export default function PaymentsIndex({
    payments,
    bills,
    houses,
    residents,
    feeTypes,
    filters,
}: {
    payments: Paginated<Payment>;
    bills: Paginated<Bill>;
    houses: House[];
    residents: Resident[];
    feeTypes: FeeType[];
    filters: { month: number; year: number; status: string };
}) {
    const [open, setOpen] = useState(false);
    const [generateOpen, setGenerateOpen] = useState(false);
    const [inputMode, setInputMode] = useState<'house' | 'resident'>('house');
    const [detailBill, setDetailBill] = useState<Bill | null>(null);
    const [detailPayment, setDetailPayment] = useState<Payment | null>(null);
    const form = useForm({
        house_id: '',
        resident_id: '',
        fee_type_id: '',
        paid_at: new Date().toISOString().slice(0, 10),
        period_month: String(filters.month),
        period_year: String(filters.year),
        months_paid: '1',
        amount: '',
        payment_method: '',
        notes: '',
    });
    const generateForm = useForm({
        period_month: String(filters.month),
        period_year: String(filters.year),
    });
    const selectedHouse = useMemo(
        () => houses.find((house) => String(house.id) === form.data.house_id),
        [houses, form.data.house_id],
    );

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(store.url(), {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    }

    function submitGenerate(event: FormEvent) {
        event.preventDefault();
        generateForm.post(BillGenerationController.url(), {
            preserveScroll: true,
            onSuccess: () => setGenerateOpen(false),
        });
    }

    function setFee(value: string) {
        form.setData('fee_type_id', value);
        const fee = feeTypes.find((item) => String(item.id) === value);

        if (fee) {
            form.setData(
                'amount',
                String(fee.amount * Number(form.data.months_paid || 1)),
            );
        }
    }

    function setHouse(value: string) {
        form.setData('house_id', value);
        const house = houses.find((item) => String(item.id) === value);
        form.setData(
            'resident_id',
            house?.active_occupancies[0]?.resident?.id
                ? String(house.active_occupancies[0].resident.id)
                : '',
        );
    }

    function setResident(value: string) {
        form.setData('resident_id', value);
        const resident = residents.find((item) => String(item.id) === value);
        form.setData(
            'house_id',
            resident?.active_occupancies[0]?.house?.id
                ? String(resident.active_occupancies[0].house.id)
                : '',
        );
    }

    return (
        <>
            <Head title="Pembayaran" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Pembayaran</h1>
                        <p className="text-sm text-muted-foreground">
                            Tagihan bulanan, pembayaran multi-bulan, dan status
                            lunas.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Dialog
                            open={generateOpen}
                            onOpenChange={setGenerateOpen}
                        >
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <RefreshCw className="size-4" />
                                    Buat tagihan periode
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <form
                                    onSubmit={submitGenerate}
                                    className="grid gap-4"
                                >
                                    <DialogHeader>
                                        <DialogTitle>
                                            Buat tagihan periode
                                        </DialogTitle>
                                    </DialogHeader>
                                    <p className="text-sm text-muted-foreground">
                                        Membuat tagihan untuk semua rumah yang
                                        sedang dihuni. Rumah kosong dilewati.
                                    </p>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label>Bulan</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={
                                                    generateForm.data
                                                        .period_month
                                                }
                                                onChange={(event) =>
                                                    generateForm.setData(
                                                        'period_month',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Tahun</Label>
                                            <Input
                                                type="number"
                                                value={
                                                    generateForm.data
                                                        .period_year
                                                }
                                                onChange={(event) =>
                                                    generateForm.setData(
                                                        'period_year',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            disabled={generateForm.processing}
                                        >
                                            {generateForm.processing
                                                ? 'Membuat...'
                                                : 'Buat tagihan'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="size-4" />
                                    Catat pembayaran
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <form onSubmit={submit} className="grid gap-4">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Catat pembayaran
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="grid gap-2 md:col-span-2">
                                            <Label>Input berdasarkan</Label>
                                            <Select
                                                value={inputMode}
                                                onValueChange={(value) => {
                                                    setInputMode(
                                                        value as
                                                            | 'house'
                                                            | 'resident',
                                                    );
                                                    form.setData(
                                                        'house_id',
                                                        '',
                                                    );
                                                    form.setData(
                                                        'resident_id',
                                                        '',
                                                    );
                                                }}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="house">
                                                        Rumah
                                                    </SelectItem>
                                                    <SelectItem value="resident">
                                                        Nama penghuni
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {inputMode === 'house' ? (
                                            <>
                                                <div className="grid gap-2">
                                                    <Label>Rumah</Label>
                                                    <Select
                                                        value={
                                                            form.data.house_id
                                                        }
                                                        onValueChange={setHouse}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Pilih rumah" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {houses.map(
                                                                (house) => (
                                                                    <SelectItem
                                                                        key={
                                                                            house.id
                                                                        }
                                                                        value={String(
                                                                            house.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            house.number
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Penghuni</Label>
                                                    <Select
                                                        value={
                                                            form.data
                                                                .resident_id
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            form.setData(
                                                                'resident_id',
                                                                value,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Pilih penghuni" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {selectedHouse?.active_occupancies.map(
                                                                (item) =>
                                                                    item.resident && (
                                                                        <SelectItem
                                                                            key={
                                                                                item
                                                                                    .resident
                                                                                    .id
                                                                            }
                                                                            value={String(
                                                                                item
                                                                                    .resident
                                                                                    .id,
                                                                            )}
                                                                        >
                                                                            {
                                                                                item
                                                                                    .resident
                                                                                    .name
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="grid gap-2 md:col-span-2">
                                                <Label>Nama penghuni</Label>
                                                <Select
                                                    value={
                                                        form.data.resident_id
                                                    }
                                                    onValueChange={setResident}
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
                                                                    {
                                                                        resident.name
                                                                    }{' '}
                                                                    -{' '}
                                                                    {resident
                                                                        .active_occupancies[0]
                                                                        ?.house
                                                                        ?.number ??
                                                                        '-'}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        <div className="grid gap-2">
                                            <Label>Jenis iuran</Label>
                                            <Select
                                                value={form.data.fee_type_id}
                                                onValueChange={setFee}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Pilih iuran" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {feeTypes.map((feeType) => (
                                                        <SelectItem
                                                            key={feeType.id}
                                                            value={String(
                                                                feeType.id,
                                                            )}
                                                        >
                                                            {feeType.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Tanggal bayar</Label>
                                            <Input
                                                type="date"
                                                value={form.data.paid_at}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'paid_at',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Bulan mulai</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={form.data.period_month}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'period_month',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Tahun</Label>
                                            <Input
                                                type="number"
                                                value={form.data.period_year}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'period_year',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Jumlah bulan</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={form.data.months_paid}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'months_paid',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Nominal</Label>
                                            <Input
                                                type="number"
                                                value={form.data.amount}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'amount',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button disabled={form.processing}>
                                            {form.processing
                                                ? 'Menyimpan...'
                                                : 'Simpan'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            Status tagihan {period(filters.month, filters.year)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rumah</TableHead>
                                    <TableHead>Penghuni</TableHead>
                                    <TableHead>Iuran</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Tagihan
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Dibayar
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bills.data.length === 0 ? (
                                    <EmptyRow colSpan={6} />
                                ) : (
                                    bills.data.map((bill) => (
                                        <TableRow
                                            key={bill.id}
                                            className="cursor-pointer"
                                            onClick={() => setDetailBill(bill)}
                                        >
                                            <TableCell>
                                                {bill.house.number}
                                            </TableCell>
                                            <TableCell>
                                                {bill.resident?.name ?? '-'}
                                            </TableCell>
                                            <TableCell>
                                                {bill.fee_type.name}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    value={bill.status}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {money(bill.amount_due)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {money(bill.amount_paid)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <Pagination links={bills.links} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Rumah</TableHead>
                                    <TableHead>Penghuni</TableHead>
                                    <TableHead>Iuran</TableHead>
                                    <TableHead>Bulan</TableHead>
                                    <TableHead className="text-right">
                                        Nominal
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.data.length === 0 ? (
                                    <EmptyRow colSpan={7} />
                                ) : (
                                    payments.data.map((payment) => (
                                        <TableRow
                                            key={payment.id}
                                            className="cursor-pointer"
                                            onClick={() =>
                                                setDetailPayment(payment)
                                            }
                                        >
                                            <TableCell>
                                                {formatWibDateTime(
                                                    payment.paid_at,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {payment.house.number}
                                            </TableCell>
                                            <TableCell>
                                                {payment.resident.name}
                                            </TableCell>
                                            <TableCell>
                                                {payment.fee_type.name}
                                            </TableCell>
                                            <TableCell>
                                                {payment.months_paid}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {money(payment.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end">
                                                    <ConfirmDeleteButton
                                                        title="Hapus pembayaran?"
                                                        description={`Pembayaran ${payment.resident.name} senilai ${money(payment.amount)} akan dihapus.`}
                                                        onConfirm={() =>
                                                            router.delete(
                                                                destroy.url(
                                                                    payment.id,
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
                        <Pagination links={payments.links} />
                    </CardContent>
                </Card>

                {detailBill && (
                    <DetailDialog
                        title={`Tagihan ${detailBill.house.number}`}
                        open={detailBill !== null}
                        onOpenChange={(value) => !value && setDetailBill(null)}
                        fields={[
                            [
                                'Periode',
                                period(
                                    detailBill.period_month,
                                    detailBill.period_year,
                                ),
                            ],
                            ['Rumah', detailBill.house.number],
                            ['Penghuni', detailBill.resident?.name ?? '-'],
                            ['Iuran', detailBill.fee_type.name],
                            [
                                'Status',
                                <StatusBadge value={detailBill.status} />,
                            ],
                            ['Tagihan', money(detailBill.amount_due)],
                            ['Dibayar', money(detailBill.amount_paid)],
                            [
                                'Sisa',
                                money(
                                    detailBill.amount_due -
                                        detailBill.amount_paid,
                                ),
                            ],
                        ]}
                    />
                )}
                {detailPayment && (
                    <DetailDialog
                        title={`Pembayaran ${detailPayment.resident.name}`}
                        open={detailPayment !== null}
                        onOpenChange={(value) =>
                            !value && setDetailPayment(null)
                        }
                        fields={[
                            [
                                'Tanggal bayar',
                                formatWibDateTime(detailPayment.paid_at),
                            ],
                            ['Rumah', detailPayment.house.number],
                            ['Penghuni', detailPayment.resident.name],
                            ['Iuran', detailPayment.fee_type.name],
                            ['Jumlah bulan', detailPayment.months_paid],
                            ['Nominal', money(detailPayment.amount)],
                            ['Metode', detailPayment.payment_method ?? '-'],
                            ['Catatan', detailPayment.notes ?? '-'],
                        ]}
                    />
                )}
            </div>
        </>
    );
}
