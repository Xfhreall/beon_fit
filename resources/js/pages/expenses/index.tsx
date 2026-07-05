import { Head, router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import {
    destroy,
    store,
} from '@/actions/App/Http/Controllers/ExpenseController';
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
    ImageInput,
    money,
    nextSort,
    Pagination,
    period,
    SortableTableHead,
    StatusBadge,
    compareSortValue,
} from '../rt-finance/shared';

type Category = { id: number; name: string; is_routine: boolean };
type Expense = {
    id: number;
    spent_at: string;
    amount: number;
    description: string;
    is_routine: boolean;
    category: Category;
};
type ExpenseSortKey = 'date' | 'category' | 'description' | 'type' | 'amount';
type ExpenseFormData = {
    expense_category_id: string;
    spent_at: string;
    amount: string;
    description: string;
    receipt: File | null;
    is_routine: boolean;
};

function expenseFormDefaults(): ExpenseFormData {
    return {
        expense_category_id: '',
        spent_at: nowLocalDateTime(),
        amount: '',
        description: '',
        receipt: null,
        is_routine: false,
    };
}

function nowLocalDateTime(): string {
    const date = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ExpensesIndex({
    expenses,
    categories,
    filters,
}: {
    expenses: Paginated<Expense>;
    categories: Category[];
    filters: { month: number; year: number; per_page: string };
}) {
    const [open, setOpen] = useState(false);
    const [detail, setDetail] = useState<Expense | null>(null);
    const [sort, setSort] = useState<SortState<ExpenseSortKey>>({
        key: 'date',
        direction: 'desc',
    });
    const form = useForm<ExpenseFormData>(expenseFormDefaults());

    const sortedCategories = useMemo(
        () =>
            [...categories].sort((a, b) => {
                const aIsOther = a.name.toLowerCase() === 'lainnya';
                const bIsOther = b.name.toLowerCase() === 'lainnya';

                if (aIsOther !== bIsOther) {
                    return aIsOther ? 1 : -1;
                }

                return a.name.localeCompare(b.name, 'id-ID', {
                    sensitivity: 'base',
                });
            }),
        [categories],
    );
    const sortedExpenses = useMemo(() => {
        return [...expenses.data].sort((a, b) => {
            const values: Record<ExpenseSortKey, string | number> = {
                date: a.spent_at,
                category: a.category.name,
                description: a.description,
                type: a.is_routine ? 'rutin' : 'non_rutin',
                amount: a.amount,
            };
            const otherValues: Record<ExpenseSortKey, string | number> = {
                date: b.spent_at,
                category: b.category.name,
                description: b.description,
                type: b.is_routine ? 'rutin' : 'non_rutin',
                amount: b.amount,
            };
            const result = compareSortValue(
                values[sort.key],
                otherValues[sort.key],
            );

            return sort.direction === 'asc' ? result : -result;
        });
    }, [expenses.data, sort]);

    function submit(event: FormEvent) {
        event.preventDefault();

        form.post(store.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    }

    return (
        <>
            <Head title="Pengeluaran" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Pengeluaran</h1>
                        <p className="text-sm text-muted-foreground">
                            Biaya rutin dan non-rutin lingkungan.
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="size-4" />
                                Tambah
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                            <form onSubmit={submit} className="grid gap-4">
                                <DialogHeader>
                                    <DialogTitle>
                                        Tambah pengeluaran
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label>Kategori</Label>
                                        <Select
                                            value={
                                                form.data.expense_category_id
                                            }
                                            onValueChange={(value) => {
                                                const category =
                                                    categories.find(
                                                        (item) =>
                                                            String(item.id) ===
                                                            value,
                                                    );
                                                form.setData(
                                                    'expense_category_id',
                                                    value,
                                                );
                                                form.setData(
                                                    'is_routine',
                                                    category?.is_routine ??
                                                        false,
                                                );
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Pilih kategori" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sortedCategories.map(
                                                    (category) => (
                                                        <SelectItem
                                                            key={category.id}
                                                            value={String(
                                                                category.id,
                                                            )}
                                                        >
                                                            {category.name}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="spent_at">
                                            Tanggal
                                        </Label>
                                        <Input
                                            id="spent_at"
                                            type="datetime-local"
                                            value={form.data.spent_at}
                                            onChange={(event) =>
                                                form.setData(
                                                    'spent_at',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="amount">Nominal</Label>
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
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">
                                            Keterangan
                                        </Label>
                                        <Input
                                            id="description"
                                            value={form.data.description}
                                            onChange={(event) =>
                                                form.setData(
                                                    'description',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <ImageInput
                                            name="receipt"
                                            label="Preview bukti"
                                            onFile={(file) =>
                                                form.setData('receipt', file)
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
                        <CardTitle>
                            Daftar pengeluaran{' '}
                            {period(filters.month, filters.year)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableTableHead
                                        sortKey="date"
                                        sort={sort}
                                        onSort={(key) =>
                                            setSort(nextSort(sort, key))
                                        }
                                    >
                                        Tanggal
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="category"
                                        sort={sort}
                                        onSort={(key) =>
                                            setSort(nextSort(sort, key))
                                        }
                                    >
                                        Kategori
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="description"
                                        sort={sort}
                                        onSort={(key) =>
                                            setSort(nextSort(sort, key))
                                        }
                                    >
                                        Keterangan
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="type"
                                        sort={sort}
                                        onSort={(key) =>
                                            setSort(nextSort(sort, key))
                                        }
                                    >
                                        Tipe
                                    </SortableTableHead>
                                    <SortableTableHead
                                        sortKey="amount"
                                        sort={sort}
                                        onSort={(key) =>
                                            setSort(nextSort(sort, key))
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
                                {expenses.data.length === 0 ? (
                                    <EmptyRow colSpan={6} />
                                ) : (
                                    sortedExpenses.map((expense) => (
                                        <TableRow
                                            key={expense.id}
                                            className="cursor-pointer"
                                            onClick={() => setDetail(expense)}
                                        >
                                            <TableCell>
                                                {formatWibDateTime(
                                                    expense.spent_at,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {expense.category.name}
                                            </TableCell>
                                            <TableCell>
                                                {expense.description}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    value={
                                                        expense.is_routine
                                                            ? 'rutin'
                                                            : 'non_rutin'
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {money(expense.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end">
                                                    <ConfirmDeleteButton
                                                        title="Hapus pengeluaran?"
                                                        description={`Pengeluaran ${expense.description} senilai ${money(expense.amount)} akan dihapus.`}
                                                        onConfirm={() =>
                                                            router.delete(
                                                                destroy.url(
                                                                    expense.id,
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
                            links={expenses.links}
                            perPage={expenses.per_page}
                        />
                    </CardContent>
                </Card>
                {detail && (
                    <DetailDialog
                        title={detail.description}
                        open={detail !== null}
                        onOpenChange={(value) => !value && setDetail(null)}
                        fields={[
                            ['Tanggal', formatWibDateTime(detail.spent_at)],
                            ['Kategori', detail.category.name],
                            ['Keterangan', detail.description],
                            ['Tipe', detail.is_routine ? 'Rutin' : 'Non-rutin'],
                            ['Nominal', money(detail.amount)],
                        ]}
                    />
                )}
            </div>
        </>
    );
}
