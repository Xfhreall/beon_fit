import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    XAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DetailDialog,
    EmptyRow,
    formatWibDateTime,
    money,
} from '../rt-finance/shared';

type Series = {
    month: string;
    income: number;
    expense: number;
    balance: number;
};
type Payment = {
    id: number;
    paid_at: string;
    amount: number;
    house: { number: string };
    resident: { name: string };
    fee_type: { name: string };
};
type Expense = {
    id: number;
    spent_at: string;
    amount: number;
    description: string;
    category: { name: string };
};
type Slice = { name: string; value: number };

const chartConfig = {
    income: { label: 'Pemasukan', color: 'var(--chart-2)' },
    expense: { label: 'Pengeluaran', color: 'var(--chart-4)' },
    balance: { label: 'Saldo', color: 'var(--chart-1)' },
    slice: { label: 'Kategori', color: 'var(--chart-3)' },
} satisfies ChartConfig;

export default function ReportsIndex({
    summary,
    yearly,
    incomeDetails,
    expenseDetails,
    expenseComposition,
    filters,
}: {
    summary: {
        income: number;
        expense: number;
        balance: number;
        accumulated_balance: number;
    };
    yearly: Series[];
    incomeDetails: Payment[];
    expenseDetails: Expense[];
    expenseComposition: Slice[];
    filters: { month: number; year: number };
}) {
    const [incomeDetail, setIncomeDetail] = useState<Payment | null>(null);
    const [expenseDetail, setExpenseDetail] = useState<Expense | null>(null);

    return (
        <>
            <Head title="Laporan" />
            <div className="flex flex-col gap-4 p-4">
                <div>
                    <h1 className="text-xl font-semibold">Laporan</h1>
                    <p className="text-sm text-muted-foreground">
                        Summary dan audit transaksi{' '}
                        {String(filters.month).padStart(2, '0')}/{filters.year}.
                    </p>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    {[
                        ['Pemasukan', summary.income],
                        ['Pengeluaran', summary.expense],
                        ['Saldo bulan', summary.balance],
                        ['Saldo akumulatif', summary.accumulated_balance],
                    ].map(([label, value]) => (
                        <Card key={label as string} size="sm">
                            <CardHeader>
                                <CardTitle>{label}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-xl font-semibold">
                                {money(value as number)}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Grafik tahunan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={chartConfig}
                                className="h-72 w-full"
                            >
                                <AreaChart data={yearly}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <ChartTooltip
                                        content={<ChartTooltipContent />}
                                    />
                                    <Area
                                        dataKey="income"
                                        fill="var(--color-income)"
                                        stroke="var(--color-income)"
                                    />
                                    <Area
                                        dataKey="expense"
                                        fill="var(--color-expense)"
                                        stroke="var(--color-expense)"
                                    />
                                    <Area
                                        dataKey="balance"
                                        fill="var(--color-balance)"
                                        stroke="var(--color-balance)"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Komposisi pengeluaran</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={chartConfig}
                                className="h-72 w-full"
                            >
                                <PieChart>
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent hideLabel />
                                        }
                                    />
                                    <Pie
                                        data={expenseComposition}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={56}
                                    >
                                        {expenseComposition.map(
                                            (slice, index) => (
                                                <Cell
                                                    key={slice.name}
                                                    fill={`var(--chart-${(index % 5) + 1})`}
                                                />
                                            ),
                                        )}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-3 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detail pemasukan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Rumah</TableHead>
                                        <TableHead>Penghuni</TableHead>
                                        <TableHead>Iuran</TableHead>
                                        <TableHead className="text-right">
                                            Nominal
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {incomeDetails.length === 0 ? (
                                        <EmptyRow colSpan={5} />
                                    ) : (
                                        incomeDetails.map((payment) => (
                                            <TableRow
                                                key={payment.id}
                                                className="cursor-pointer"
                                                onClick={() =>
                                                    setIncomeDetail(payment)
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
                                                <TableCell className="text-right">
                                                    {money(payment.amount)}
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
                            <CardTitle>Detail pengeluaran</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                        <TableHead className="text-right">
                                            Nominal
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenseDetails.length === 0 ? (
                                        <EmptyRow colSpan={4} />
                                    ) : (
                                        expenseDetails.map((expense) => (
                                            <TableRow
                                                key={expense.id}
                                                className="cursor-pointer"
                                                onClick={() =>
                                                    setExpenseDetail(expense)
                                                }
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
                                                <TableCell className="text-right">
                                                    {money(expense.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                {incomeDetail && (
                    <DetailDialog
                        title={`Pemasukan ${incomeDetail.resident.name}`}
                        open={incomeDetail !== null}
                        onOpenChange={(value) =>
                            !value && setIncomeDetail(null)
                        }
                        fields={[
                            [
                                'Tanggal',
                                formatWibDateTime(incomeDetail.paid_at),
                            ],
                            ['Rumah', incomeDetail.house.number],
                            ['Penghuni', incomeDetail.resident.name],
                            ['Iuran', incomeDetail.fee_type.name],
                            ['Nominal', money(incomeDetail.amount)],
                        ]}
                    />
                )}
                {expenseDetail && (
                    <DetailDialog
                        title={expenseDetail.description}
                        open={expenseDetail !== null}
                        onOpenChange={(value) =>
                            !value && setExpenseDetail(null)
                        }
                        fields={[
                            [
                                'Tanggal',
                                formatWibDateTime(expenseDetail.spent_at),
                            ],
                            ['Kategori', expenseDetail.category.name],
                            ['Keterangan', expenseDetail.description],
                            ['Nominal', money(expenseDetail.amount)],
                        ]}
                    />
                )}
            </div>
        </>
    );
}
