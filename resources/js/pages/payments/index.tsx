import { Head, router } from '@inertiajs/react';
import {
    useForm as useTanStackForm,
    useStore,
} from '@tanstack/react-form';
import { Plus, RefreshCw } from 'lucide-react';
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
import type { Paginated, SortState } from '../rt-finance/shared';
import {
    ConfirmDeleteButton,
    DetailDialog,
    EmptyRow,
    FieldError,
    compareSortValue,
    formatWibDateTime,
    monthName,
    money,
    nextSort,
    Pagination,
    period,
    requiredField,
    SortableTableHead,
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
        paid_at: new Date().toISOString().slice(0, 10),
        period_month: String(filters.month),
        period_year: String(filters.year),
        months_paid: '1',
        amount: '',
        payment_method: '',
        notes: '',
    };
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
    filters: { month: number; year: number; status: string };
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
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [generateProcessing, setGenerateProcessing] = useState(false);
    const form = useTanStackForm({
        defaultValues: paymentFormDefaults(filters),
        onSubmit: ({ value }) => submit(value),
    });
    const generateForm = useTanStackForm({
        defaultValues: generateFormDefaults(filters),
        onSubmit: ({ value }) => submitGenerate(value),
    });
    const selectedHouseId = useStore(
        form.store,
        (state) => state.values.house_id,
    );
    const selectedHouse = useMemo(
        () => houses.find((house) => String(house.id) === selectedHouseId),
        [houses, selectedHouseId],
    );
    const monthOptions = useMemo(
        () =>
            Array.from({ length: 12 }, (_, index) => ({
                value: String(index + 1),
                label: monthName(index + 1),
            })),
        [],
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

    function submit(value: PaymentFormData) {
        router.post(store.url(), value, {
            preserveScroll: true,
            onStart: () => setPaymentProcessing(true),
            onFinish: () => setPaymentProcessing(false),
            onSuccess: () => setOpen(false),
        });
    }

    function submitGenerate(value: GenerateFormData) {
        router.post(BillGenerationController.url(), value, {
            preserveScroll: true,
            onStart: () => setGenerateProcessing(true),
            onFinish: () => setGenerateProcessing(false),
            onSuccess: () => setGenerateOpen(false),
        });
    }

    function setFee(value: string) {
        form.setFieldValue('fee_type_id', value);
        const fee = feeTypes.find((item) => String(item.id) === value);

        if (fee) {
            form.setFieldValue(
                'amount',
                String(
                    fee.amount * Number(form.getFieldValue('months_paid') || 1),
                ),
            );
        }
    }

    function setHouse(value: string) {
        form.setFieldValue('house_id', value);
        const house = houses.find((item) => String(item.id) === value);
        form.setFieldValue(
            'resident_id',
            house?.active_occupancies[0]?.resident?.id
                ? String(house.active_occupancies[0].resident.id)
                : '',
        );
    }

    function setResident(value: string) {
        form.setFieldValue('resident_id', value);
        const resident = residents.find((item) => String(item.id) === value);
        form.setFieldValue(
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
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        void generateForm.handleSubmit();
                                    }}
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
                                        <generateForm.Field name="period_month">
                                            {(field) => (
                                                <div className="grid gap-2">
                                                    <Label>Bulan</Label>
                                                    <Select
                                                        value={
                                                            field.state.value
                                                        }
                                                        onValueChange={
                                                            field.handleChange
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {monthOptions.map(
                                                                (month) => (
                                                                    <SelectItem
                                                                        key={
                                                                            month.value
                                                                        }
                                                                        value={
                                                                            month.value
                                                                        }
                                                                    >
                                                                        {
                                                                            month.label
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </generateForm.Field>
                                        <generateForm.Field
                                            name="period_year"
                                            validators={{
                                                onBlur: requiredField('Tahun'),
                                                onChange:
                                                    requiredField('Tahun'),
                                            }}
                                        >
                                            {(field) => (
                                                <div className="grid gap-2">
                                                    <Label htmlFor={field.name}>
                                                        Tahun
                                                    </Label>
                                                    <Input
                                                        id={field.name}
                                                        type="number"
                                                        value={
                                                            field.state.value
                                                        }
                                                        onBlur={
                                                            field.handleBlur
                                                        }
                                                        onChange={(event) =>
                                                            field.handleChange(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                    <FieldError
                                                        errors={
                                                            field.state.meta
                                                                .errors
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </generateForm.Field>
                                    </div>
                                    <DialogFooter>
                                        <generateForm.Subscribe
                                            selector={(state) => ({
                                                canSubmit: state.canSubmit,
                                                isSubmitting:
                                                    state.isSubmitting,
                                            })}
                                        >
                                            {({ canSubmit, isSubmitting }) => (
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        !canSubmit ||
                                                        isSubmitting ||
                                                        generateProcessing
                                                    }
                                                >
                                                    {generateProcessing
                                                        ? 'Membuat...'
                                                        : 'Buat tagihan'}
                                                </Button>
                                            )}
                                        </generateForm.Subscribe>
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
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        void form.handleSubmit();
                                    }}
                                    className="grid gap-4"
                                >
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
                                                    form.setFieldValue(
                                                        'house_id',
                                                        '',
                                                    );
                                                    form.setFieldValue(
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
                                                <form.Field
                                                    name="house_id"
                                                    validators={{
                                                        onBlur:
                                                            requiredField(
                                                                'Rumah',
                                                            ),
                                                        onChange:
                                                            requiredField(
                                                                'Rumah',
                                                            ),
                                                    }}
                                                >
                                                    {(field) => (
                                                        <div className="grid gap-2">
                                                            <Label>Rumah</Label>
                                                            <Select
                                                                value={
                                                                    field.state
                                                                        .value
                                                                }
                                                                onValueChange={
                                                                    setHouse
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Pilih rumah" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {houses.map(
                                                                        (
                                                                            house,
                                                                        ) => (
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
                                                            <FieldError
                                                                errors={
                                                                    field.state
                                                                        .meta
                                                                        .errors
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                                </form.Field>
                                                <form.Field
                                                    name="resident_id"
                                                    validators={{
                                                        onBlur:
                                                            requiredField(
                                                                'Penghuni',
                                                            ),
                                                        onChange:
                                                            requiredField(
                                                                'Penghuni',
                                                            ),
                                                    }}
                                                >
                                                    {(field) => (
                                                        <div className="grid gap-2">
                                                            <Label>
                                                                Penghuni
                                                            </Label>
                                                            <Select
                                                                value={
                                                                    field.state
                                                                        .value
                                                                }
                                                                onValueChange={
                                                                    field.handleChange
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Pilih penghuni" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {selectedHouse?.active_occupancies.map(
                                                                        (
                                                                            item,
                                                                        ) =>
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
                                                            <FieldError
                                                                errors={
                                                                    field.state
                                                                        .meta
                                                                        .errors
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                                </form.Field>
                                            </>
                                        ) : (
                                            <form.Field
                                                name="resident_id"
                                                validators={{
                                                    onBlur:
                                                        requiredField(
                                                            'Nama penghuni',
                                                        ),
                                                    onChange:
                                                        requiredField(
                                                            'Nama penghuni',
                                                        ),
                                                }}
                                            >
                                                {(field) => (
                                                    <div className="grid gap-2 md:col-span-2">
                                                        <Label>
                                                            Nama penghuni
                                                        </Label>
                                                        <Select
                                                            value={
                                                                field.state
                                                                    .value
                                                            }
                                                            onValueChange={
                                                                setResident
                                                            }
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Pilih penghuni" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {residents.map(
                                                                    (
                                                                        resident,
                                                                    ) => (
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
                                                        <FieldError
                                                            errors={
                                                                field.state.meta
                                                                    .errors
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </form.Field>
                                        )}
                                        <form.Field
                                            name="fee_type_id"
                                            validators={{
                                                onBlur:
                                                    requiredField(
                                                        'Jenis iuran',
                                                    ),
                                                onChange:
                                                    requiredField(
                                                        'Jenis iuran',
                                                    ),
                                            }}
                                        >
                                            {(field) => (
                                                <div className="grid gap-2">
                                                    <Label>Jenis iuran</Label>
                                                    <Select
                                                        value={
                                                            field.state.value
                                                        }
                                                        onValueChange={setFee}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Pilih iuran" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {feeTypes.map(
                                                                (feeType) => (
                                                                    <SelectItem
                                                                        key={
                                                                            feeType.id
                                                                        }
                                                                        value={String(
                                                                            feeType.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            feeType.name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <FieldError
                                                        errors={
                                                            field.state.meta
                                                                .errors
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </form.Field>
                                        <form.Field
                                            name="paid_at"
                                            validators={{
                                                onBlur:
                                                    requiredField(
                                                        'Tanggal bayar',
                                                    ),
                                                onChange:
                                                    requiredField(
                                                        'Tanggal bayar',
                                                    ),
                                            }}
                                        >
                                            {(field) => (
                                                <div className="grid gap-2">
                                                    <Label htmlFor={field.name}>
                                                        Tanggal bayar
                                                    </Label>
                                                    <Input
                                                        id={field.name}
                                                        type="date"
                                                        value={
                                                            field.state.value
                                                        }
                                                        onBlur={
                                                            field.handleBlur
                                                        }
                                                        onChange={(event) =>
                                                            field.handleChange(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                    <FieldError
                                                        errors={
                                                            field.state.meta
                                                                .errors
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </form.Field>
                                        <form.Field name="period_month">
                                            {(field) => (
                                                <div className="grid gap-2">
                                                    <Label>Bulan mulai</Label>
                                                    <Select
                                                        value={
                                                            field.state.value
                                                        }
                                                        onValueChange={
                                                            field.handleChange
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {monthOptions.map(
                                                                (month) => (
                                                                    <SelectItem
                                                                        key={
                                                                            month.value
                                                                        }
                                                                        value={
                                                                            month.value
                                                                        }
                                                                    >
                                                                        {
                                                                            month.label
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </form.Field>
                                        <form.Field
                                            name="period_year"
                                            validators={{
                                                onBlur: requiredField('Tahun'),
                                                onChange:
                                                    requiredField('Tahun'),
                                            }}
                                        >
                                            {(field) => (
                                                <div className="grid gap-2">
                                                    <Label htmlFor={field.name}>
                                                        Tahun
                                                    </Label>
                                                    <Input
                                                        id={field.name}
                                                        type="number"
                                                        value={
                                                            field.state.value
                                                        }
                                                        onBlur={
                                                            field.handleBlur
                                                        }
                                                        onChange={(event) =>
                                                            field.handleChange(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                    <FieldError
                                                        errors={
                                                            field.state.meta
                                                                .errors
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </form.Field>
                                        <form.Field
                                            name="months_paid"
                                            validators={{
                                                onBlur:
                                                    requiredField(
                                                        'Jumlah bulan',
                                                    ),
                                                onChange:
                                                    requiredField(
                                                        'Jumlah bulan',
                                                    ),
                                            }}
                                        >
                                            {(field) => (
                                                <div className="grid gap-2">
                                                    <Label htmlFor={field.name}>
                                                        Jumlah bulan
                                                    </Label>
                                                    <Input
                                                        id={field.name}
                                                        type="number"
                                                        min="1"
                                                        max="12"
                                                        value={
                                                            field.state.value
                                                        }
                                                        onBlur={
                                                            field.handleBlur
                                                        }
                                                        onChange={(event) =>
                                                            field.handleChange(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                    <FieldError
                                                        errors={
                                                            field.state.meta
                                                                .errors
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </form.Field>
                                        <form.Field
                                            name="amount"
                                            validators={{
                                                onBlur:
                                                    requiredField('Nominal'),
                                                onChange:
                                                    requiredField('Nominal'),
                                            }}
                                        >
                                            {(field) => (
                                                <div className="grid gap-2">
                                                    <Label htmlFor={field.name}>
                                                        Nominal
                                                    </Label>
                                                    <Input
                                                        id={field.name}
                                                        type="number"
                                                        value={
                                                            field.state.value
                                                        }
                                                        onBlur={
                                                            field.handleBlur
                                                        }
                                                        onChange={(event) =>
                                                            field.handleChange(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                    <FieldError
                                                        errors={
                                                            field.state.meta
                                                                .errors
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </form.Field>
                                    </div>
                                    <DialogFooter>
                                        <form.Subscribe
                                            selector={(state) => ({
                                                canSubmit: state.canSubmit,
                                                isSubmitting:
                                                    state.isSubmitting,
                                            })}
                                        >
                                            {({ canSubmit, isSubmitting }) => (
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        !canSubmit ||
                                                        isSubmitting ||
                                                        paymentProcessing
                                                    }
                                                >
                                                    {paymentProcessing
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
                                    combinedBills.map((bill) => (
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
