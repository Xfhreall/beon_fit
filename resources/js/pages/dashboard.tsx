import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
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
import { dashboard } from '@/routes';
import {
    DetailDialog,
    EmptyRow,
    money,
    StatusBadge,
} from './rt-finance/shared';

type Summary = {
    total_houses: number;
    occupied_houses: number;
    vacant_houses: number;
    permanent_residents: number;
    contract_residents: number;
    monthly_income: number;
    monthly_expense: number;
    monthly_balance: number;
    unpaid_bills: number;
};

type Series = {
    month: string;
    income: number;
    expense: number;
    balance: number;
};
type Slice = { name: string; value: number };
type UnpaidBill = {
    id: number;
    house: string;
    resident: string;
    fee_type: string;
    period: string;
    amount_due: number;
    amount_paid: number;
    status: string;
};

const chartConfig = {
    income: { label: 'Pemasukan', color: 'var(--chart-2)' },
    expense: { label: 'Pengeluaran', color: 'var(--chart-4)' },
    balance: { label: 'Saldo', color: 'var(--chart-1)' },
    occupied: { label: 'Dihuni', color: 'var(--chart-2)' },
    vacant: { label: 'Tidak dihuni', color: 'var(--chart-5)' },
} satisfies ChartConfig;

export default function Dashboard({
    summary,
    yearly,
    houseStatus,
    unpaidBills,
}: {
    summary: Summary;
    yearly: Series[];
    houseStatus: Slice[];
    unpaidBills: UnpaidBill[];
}) {
    const [detail, setDetail] = useState<UnpaidBill | null>(null);
    const cards = [
        ['Total rumah', summary.total_houses],
        ['Rumah dihuni', summary.occupied_houses],
        ['Rumah kosong', summary.vacant_houses],
        ['Penghuni tetap', summary.permanent_residents],
        ['Penghuni kontrak', summary.contract_residents],
        ['Belum lunas', summary.unpaid_bills],
    ];

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-4 p-4">
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    {cards.map(([label, value]) => (
                        <Card key={label as string} size="sm">
                            <CardHeader>
                                <CardTitle>{label}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-2xl font-semibold">
                                {value}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Tren kas 12 bulan</CardTitle>
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
                            <CardTitle>Status rumah</CardTitle>
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
                                        data={houseStatus}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={58}
                                    >
                                        {houseStatus.map((slice, index) => (
                                            <Cell
                                                key={slice.name}
                                                fill={
                                                    index === 0
                                                        ? 'var(--color-occupied)'
                                                        : 'var(--color-vacant)'
                                                }
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bulan berjalan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={chartConfig}
                                className="h-56 w-full"
                            >
                                <BarChart data={[summary]}>
                                    <XAxis
                                        dataKey={() => 'Kas'}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <ChartTooltip
                                        content={<ChartTooltipContent />}
                                    />
                                    <Bar
                                        dataKey="monthly_income"
                                        name="Pemasukan"
                                        fill="var(--color-income)"
                                        radius={4}
                                    />
                                    <Bar
                                        dataKey="monthly_expense"
                                        name="Pengeluaran"
                                        fill="var(--color-expense)"
                                        radius={4}
                                    />
                                </BarChart>
                            </ChartContainer>
                            <div className="mt-3 grid gap-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Pemasukan</span>
                                    <strong>
                                        {money(summary.monthly_income)}
                                    </strong>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pengeluaran</span>
                                    <strong>
                                        {money(summary.monthly_expense)}
                                    </strong>
                                </div>
                                <div className="flex justify-between">
                                    <span>Saldo</span>
                                    <strong>
                                        {money(summary.monthly_balance)}
                                    </strong>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Pembayaran belum lunas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rumah</TableHead>
                                        <TableHead>Penghuni</TableHead>
                                        <TableHead>Iuran</TableHead>
                                        <TableHead>Periode</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">
                                            Sisa
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {unpaidBills.length === 0 ? (
                                        <EmptyRow colSpan={6} />
                                    ) : (
                                        unpaidBills.map((bill) => (
                                            <TableRow
                                                key={bill.id}
                                                className="cursor-pointer"
                                                onClick={() => setDetail(bill)}
                                            >
                                                <TableCell>
                                                    {bill.house}
                                                </TableCell>
                                                <TableCell>
                                                    {bill.resident}
                                                </TableCell>
                                                <TableCell>
                                                    {bill.fee_type}
                                                </TableCell>
                                                <TableCell>
                                                    {bill.period}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        value={bill.status}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {money(
                                                        bill.amount_due -
                                                            bill.amount_paid,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                {detail && (
                    <DetailDialog
                        title={`Tagihan ${detail.house}`}
                        open={detail !== null}
                        onOpenChange={(value) => !value && setDetail(null)}
                        fields={[
                            ['Rumah', detail.house],
                            ['Penghuni', detail.resident],
                            ['Iuran', detail.fee_type],
                            ['Periode', detail.period],
                            ['Status', <StatusBadge value={detail.status} />],
                            ['Tagihan', money(detail.amount_due)],
                            ['Dibayar', money(detail.amount_paid)],
                            [
                                'Sisa',
                                money(detail.amount_due - detail.amount_paid),
                            ],
                        ]}
                    />
                )}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
