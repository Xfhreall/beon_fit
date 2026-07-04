import { Head, router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
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
import type { Paginated } from '../rt-finance/shared';
import {
    ConfirmDeleteButton,
    DetailDialog,
    EmptyRow,
    formatWibDateTime,
    ImageInput,
    money,
    Pagination,
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

export default function ExpensesIndex({
    expenses,
    categories,
    filters,
}: {
    expenses: Paginated<Expense>;
    categories: Category[];
    filters: { month: number; year: number };
}) {
    const [open, setOpen] = useState(false);
    const [detail, setDetail] = useState<Expense | null>(null);
    const form = useForm({
        expense_category_id: '',
        spent_at: new Date().toISOString().slice(0, 10),
        amount: '',
        description: '',
        receipt: null as File | null,
        is_routine: false,
    });

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
                                                {categories.map((category) => (
                                                    <SelectItem
                                                        key={category.id}
                                                        value={String(
                                                            category.id,
                                                        )}
                                                    >
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Tanggal</Label>
                                        <Input
                                            type="date"
                                            value={form.data.spent_at}
                                            onChange={(e) =>
                                                form.setData(
                                                    'spent_at',
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
                                    <div className="grid gap-2">
                                        <Label>Keterangan</Label>
                                        <Input
                                            value={form.data.description}
                                            onChange={(e) =>
                                                form.setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
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

                <Card>
                    <CardHeader>
                        <CardTitle>
                            Daftar pengeluaran{' '}
                            {String(filters.month).padStart(2, '0')}/
                            {filters.year}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead className="text-right">
                                        Nominal
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.data.length === 0 ? (
                                    <EmptyRow colSpan={6} />
                                ) : (
                                    expenses.data.map((expense) => (
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
                                                {expense.is_routine
                                                    ? 'Rutin'
                                                    : 'Non-rutin'}
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
                        <Pagination links={expenses.links} />
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
