<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Expense;
use App\Models\House;
use App\Models\Payment;
use App\Models\Resident;
use Carbon\CarbonImmutable;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $period = CarbonImmutable::now();
        $year = (int) $period->year;
        $month = (int) $period->month;

        $monthlyIncome = Payment::where('period_year', $year)
            ->where('period_month', $month)
            ->sum('amount');
        $monthlyExpense = Expense::whereYear('spent_at', $year)
            ->whereMonth('spent_at', $month)
            ->sum('amount');

        return Inertia::render('dashboard', [
            'summary' => [
                'year' => $year,
                'total_houses' => House::count(),
                'occupied_houses' => House::where('status', 'dihuni')->count(),
                'vacant_houses' => House::where('status', 'tidak_dihuni')->count(),
                'permanent_residents' => Resident::where('resident_status', 'tetap')->count(),
                'contract_residents' => Resident::where('resident_status', 'kontrak')->count(),
                'monthly_income' => (int) $monthlyIncome,
                'monthly_expense' => (int) $monthlyExpense,
                'monthly_balance' => (int) ($monthlyIncome - $monthlyExpense),
                'unpaid_bills' => Bill::whereIn('status', ['belum_lunas', 'sebagian'])->count(),
            ],
            'yearly' => $this->yearlySeries($year),
            'houseStatus' => [
                ['name' => 'Dihuni', 'value' => House::where('status', 'dihuni')->count()],
                ['name' => 'Tidak dihuni', 'value' => House::where('status', 'tidak_dihuni')->count()],
            ],
            'unpaidBills' => Bill::query()
                ->with(['house:id,number,block', 'resident:id,name', 'feeType:id,name'])
                ->whereIn('status', ['belum_lunas', 'sebagian'])
                ->orderBy('period_year')
                ->orderBy('period_month')
                ->limit(8)
                ->get()
                ->map(fn (Bill $bill): array => [
                    'id' => $bill->id,
                    'house' => $bill->house->number,
                    'resident' => $bill->resident?->name ?? '-',
                    'fee_type' => $bill->feeType->name,
                    'period' => sprintf('%02d/%d', $bill->period_month, $bill->period_year),
                    'amount_due' => $bill->amount_due,
                    'amount_paid' => $bill->amount_paid,
                    'status' => $bill->status,
                ]),
        ]);
    }

    /**
     * @return array<int, array{month: string, income: int, expense: int, balance: int}>
     */
    private function yearlySeries(int $year): array
    {
        $runningBalance = 0;

        return collect(range(1, 12))->map(function (int $month) use ($year, &$runningBalance): array {
            $income = (int) Payment::where('period_year', $year)
                ->where('period_month', $month)
                ->sum('amount');
            $expense = (int) Expense::whereYear('spent_at', $year)
                ->whereMonth('spent_at', $month)
                ->sum('amount');
            $runningBalance += $income - $expense;

            return [
                'month' => CarbonImmutable::create($year, $month)->format('M'),
                'income' => $income,
                'expense' => $expense,
                'balance' => $runningBalance,
            ];
        })->all();
    }
}
