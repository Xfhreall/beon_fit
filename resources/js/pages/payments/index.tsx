import { Head, router, useForm } from '@inertiajs/react';
import { Plus, RefreshCw } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import BillGenerationController from '@/actions/App/Http/Controllers/BillGenerationController';
import {
    destroy,
    index,
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
import type { Paginated, SortState } from '../rt-finance/shared';
import {
    ConfirmDeleteButton,
    DetailDialog,
    EmptyRow,
    formatWibDateTime,
    money,
    nextSort,
    Pagination,
    period,
    SortableTableHead,
    StatusBadge,
    compareSortValue,
    useLocalPagination,
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
    house: { id: number; number: string };
    resident?: { id: number; name: string };
    fee_type: { name: string };
};
type CombinedBill = {
    id: string;
    period_month: number;
    period_year: number;
    amount_due: number;
    amount_paid: number;
    status: string;
    house: { id: number; number: string };
    resident?: { id: number; name: string };
    fee_names: string;
};
type BillSortKey = 'house' | 'resident' | 'fee' | 'status' | 'due' | 'paid';
type PaymentSortKey =
    'paid_at' | 'house' | 'resident' | 'fee' | 'months' | 'amount';
type PaymentFormData = {
    house_id: string;
    resident_id: string;
    fee_type_id: string;
    paid_at: string;
    period_month: string;
    period_year: string;
    months_paid: string;
    amount: string;
    payment_method: string;
    notes: string;
};
type GenerateFormData = {
    period_month: string;
    period_year: string;
};

function paymentFormDefaults(filters: {
    month: number;
    year: number;
}): PaymentFormData {
    return {
        house_id: '',
        resident_id: '',
        fee_type_id: '',
        paid_at: nowLocalDateTime(),
        period_month: String(filters.month),
        period_year: String(filters.year),
        months_paid: '1',
        amount: '',
        payment_method: '',
        notes: '',
    };
}

function nowLocalDateTime(): string {
    const date = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function generateFormDefaults(filters: {
    month: number;
    year: number;
}): GenerateFormData {
    return {
        period_month: String(filters.month),
        period_year: String(filters.year),
    };
}

export default function PaymentsIndex({
    payments,
    bills,
    houses,
    residents,
    feeTypes,
    filters,
}: {
    payments: Paginated<Payment>;
    bills: Bill[];
    houses: House[];
    residents: Resident[];
    feeTypes: FeeType[];
    filters: { month: number; year: number; status: string; per_page: string };
}) {
    const [open, setOpen] = useState(false);
    const [generateOpen, setGenerateOpen] = useState(false);
    const [inputMode, setInputMode] = useState<'house' | 'resident'>('house');
    const [detailBill, setDetailBill] = useState<CombinedBill | null>(null);
    const [detailPayment, setDetailPayment] = useState<Payment | null>(null);
    const [billSort, setBillSort] = useState<SortState<BillSortKey>>({
        key: 'house',
        direction: 'asc',
    });
    const [paymentSort, setPaymentSort] = useState<SortState<PaymentSortKey>>({
        key: 'paid_at',
        direction: 'desc',
    });
    const form = useForm<PaymentFormData>(paymentFormDefaults(filters));
    const generateForm = useForm<GenerateFormData>(
        generateFormDefaults(filters),
    );
    const selectedHouse = useMemo(
        () => houses.find((house) => String(house.id) === form.data.house_id),
        [houses, form.data.house_id],
    );
    const combinedBills = useMemo(() => {
        const rows = new Map<string, CombinedBill>();

        bills.forEach((bill) => {
            const key = [
                bill.house.id,
                bill.resident?.id ?? 'none',
                bill.period_year,
                bill.period_month,
            ].join(':');
            const existing = rows.get(key);

            if (!existing) {
                rows.set(key, {
                    id: key,
                    period_month: bill.period_month,
                    period_year: bill.period_year,
                    amount_due: bill.amount_due,
                    amount_paid: bill.amount_paid,
                    status: bill.status,
                    house: bill.house,
                    resident: bill.resident,
                    fee_names: bill.fee_type.name,
                });

                return;
            }

            existing.amount_due += bill.amount_due;
            existing.amount_paid += bill.amount_paid;
            existing.fee_names = `${existing.fee_names} + ${bill.fee_type.name}`;
            existing.status =
                existing.amount_paid >= existing.amount_due
                    ? 'lunas'
                    : existing.amount_paid > 0
                      ? 'sebagian'
                      : 'belum_lunas';
        });

        return [...rows.values()].sort((a, b) => {
            const values: Record<BillSortKey, string | number> = {
                house: a.house.number,
                resident: a.resident?.name ?? '',
                fee: a.fee_names,
                status: a.status,
                due: a.amount_due,
                paid: a.amount_paid,
            };
            const otherValues: Record<BillSortKey, string | number> = {
                house: b.house.number,
                resident: b.resident?.name ?? '',
                fee: b.fee_names,
                status: b.status,
                due: b.amount_due,
                paid: b.amount_paid,
            };
            const result = compareSortValue(
                values[billSort.key],
                otherValues[billSort.key],
            );

            return billSort.direction === 'asc' ? result : -result;
        });
    }, [billSort, bills]);
    const paginatedBills = useLocalPagination(combinedBills);
    const sortedPayments = useMemo(() => {
        return [...payments.data].sort((a, b) => {
            const values: Record<PaymentSortKey, string | number> = {
                paid_at: a.paid_at,
                house: a.house.number,
                resident: a.resident.name,
                fee: a.fee_type.name,
                months: a.months_paid,
                amount: a.amount,
            };
            const otherValues: Record<PaymentSortKey, string | number> = {
                paid_at: b.paid_at,
                house: b.house.number,
                resident: b.resident.name,
                fee: b.fee_type.name,
                months: b.months_paid,
                amount: b.amount,
            };
            const result = compareSortValue(
                values[paymentSort.key],
                otherValues[paymentSort.key],
            );

            return paymentSort.direction === 'asc' ? result : -result;
        });
    }, [payments.data, paymentSort]);

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
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Dialog
                            open={generateOpen}
                            onOpenChange={setGenerateOpen}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                >
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
                                            <Label htmlFor="generate_month">
                                                Bulan
                                            </Label>
                                            <Input
                                                id="generate_month"
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
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="generate_year">
                                                Tahun
                                            </Label>
                                            <Input
                                                id="generate_year"
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
                                                required
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="submit"
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
                                <Button className="w-full sm:w-auto">
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
                                                                (item, index) =>
                                                                    item.resident && (
                                                                        <SelectItem
                                                                            key={`${item.resident.id}-${index}`}
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
                                            <Label htmlFor="paid_at">
                                                Tanggal bayar
                                            </Label>
                                            <Input
                                                id="paid_at"
                                                type="datetime-local"
                                                value={form.data.paid_at}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'paid_at',
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="period_month">
                                                Bulan mulai
                                            </Label>
                                            <Input
                                                id="period_month"
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={form.data.period_month}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'period_month',
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="period_year">
                                                Tahun
                                            </Label>
                                            <Input
                                                id="period_year"
                                                type="number"
                                                value={form.data.period_year}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'period_year',
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="months_paid">
                                                Jumlah bulan
                                            </Label>
                                            <Input
                                                id="months_paid"
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={form.data.months_paid}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'months_paid',
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="amount">
                                                Nominal
                                            </Label>
                                            <Input
                                                id="amount"
                                                type="number"
                                                value={form.data.amount}
                                                onChange={(event) =>
                                                    form.setData(
                                                        'amount',
                                                        event.target.value,
                                                    )
                                                }
                                                required
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
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <CardTitle>
                                Status tagihan{' '}
                                {period(filters.month, filters.year)}
                            </CardTitle>
                            <Select
                                value={filters.status}
                                onValueChange={(value) =>
                                    router.get(
                                        index.url(),
                                        { ...filters, status: value },
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                        },
                                    )
                                }
                            >
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue placeholder="Semua status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Semua</SelectItem>
                                    <SelectItem value="belum_lunas">
                                        Belum lunas
                                    </SelectItem>
                                    <SelectItem value="sebagian">
                                        Sebagian
                                    </SelectItem>
                                    <SelectItem value="lunas">Lunas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <Table className="min-w-[720px]">
                            <TableHeader>
                                <TableRow>
                                    <SortableTableHead
                                        sortKey="house"
                                        sort={billSort}
                                        onSort={(key) =>
                                            setBillSort(nextSort(billSort, key))
                                        }
                                    >
                                        Rumah
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="resident"
                                        sort={billSort}
                                        onSort={(key) =>
                                            setBillSort(nextSort(billSort, key))
                                        }
                                    >
                                        Penghuni
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="fee"
                                        sort={billSort}
                                        onSort={(key) =>
                                            setBillSort(nextSort(billSort, key))
                                        }
                                    >
                                        Iuran
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="status"
                                        sort={billSort}
                                        onSort={(key) =>
                                            setBillSort(nextSort(billSort, key))
                                        }
                                    >
                                        Status
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="due"
                                        sort={billSort}
                                        onSort={(key) =>
                                            setBillSort(nextSort(billSort, key))
                                        }
                                        className="text-right"
                                    >
                                        Tagihan
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="paid"
                                        sort={billSort}
                                        onSort={(key) =>
                                            setBillSort(nextSort(billSort, key))
                                        }
                                        className="text-right"
                                    >
                                        Dibayar
                                    </SortableTableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {combinedBills.length === 0 ? (
                                    <EmptyRow colSpan={6} />
                                ) : (
                                    paginatedBills.data.map((bill) => (
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
                                                {bill.fee_names}
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
                        {combinedBills.length > 0 && paginatedBills.controls}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <Table className="min-w-[820px]">
                            <TableHeader>
                                <TableRow>
                                    <SortableTableHead
                                        sortKey="paid_at"
                                        sort={paymentSort}
                                        onSort={(key) =>
                                            setPaymentSort(
                                                nextSort(paymentSort, key),
                                            )
                                        }
                                    >
                                        Tanggal
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="house"
                                        sort={paymentSort}
                                        onSort={(key) =>
                                            setPaymentSort(
                                                nextSort(paymentSort, key),
                                            )
                                        }
                                    >
                                        Rumah
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="resident"
                                        sort={paymentSort}
                                        onSort={(key) =>
                                            setPaymentSort(
                                                nextSort(paymentSort, key),
                                            )
                                        }
                                    >
                                        Penghuni
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="fee"
                                        sort={paymentSort}
                                        onSort={(key) =>
                                            setPaymentSort(
                                                nextSort(paymentSort, key),
                                            )
                                        }
                                    >
                                        Iuran
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="months"
                                        sort={paymentSort}
                                        onSort={(key) =>
                                            setPaymentSort(
                                                nextSort(paymentSort, key),
                                            )
                                        }
                                    >
                                        Bulan
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="amount"
                                        sort={paymentSort}
                                        onSort={(key) =>
                                            setPaymentSort(
                                                nextSort(paymentSort, key),
                                            )
                                        }
                                        className="text-right"
                                    >
                                        Nominal
                                    </SortableTableHead>
                                    <TableHead className="text-right">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.data.length === 0 ? (
                                    <EmptyRow colSpan={7} />
                                ) : (
                                    sortedPayments.map((payment) => (
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
                        <Pagination
                            links={payments.links}
                            perPage={payments.per_page}
                        />
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
                            ['Iuran', detailBill.fee_names],
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
