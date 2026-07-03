<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Payment;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $month = (int) $request->integer('month', now()->month);
        $year = (int) $request->integer('year', now()->year);
        $income = Payment::where('period_year', $year)->where('period_month', $month)->sum('amount');
        $expense = Expense::whereYear('spent_at', $year)->whereMonth('spent_at', $month)->sum('amount');

        return Inertia::render('reports/index', [
            'filters' => ['month' => $month, 'year' => $year],
            'summary' => [
                'income' => (int) $income,
                'expense' => (int) $expense,
                'balance' => (int) ($income - $expense),
                'accumulated_balance' => $this->accumulatedBalance($year, $month),
            ],
            'yearly' => $this->yearlySeries($year),
            'incomeDetails' => Payment::with(['house:id,number', 'resident:id,name', 'feeType:id,name'])
                ->where('period_year', $year)
                ->where('period_month', $month)
                ->latest('paid_at')
                ->get(),
            'expenseDetails' => Expense::with('category:id,name')
                ->whereYear('spent_at', $year)
                ->whereMonth('spent_at', $month)
                ->latest('spent_at')
                ->get(),
            'expenseComposition' => Expense::with('category:id,name')
                ->whereYear('spent_at', $year)
                ->whereMonth('spent_at', $month)
                ->get()
                ->groupBy('category.name')
                ->map(fn ($items, string $name): array => ['name' => $name, 'value' => (int) $items->sum('amount')])
                ->values(),
        ]);
    }

    private function accumulatedBalance(int $year, int $month): int
    {
        $until = CarbonImmutable::create($year, $month, 1)->endOfMonth();
        $income = Payment::where(function ($query) use ($until): void {
            $query->where('period_year', '<', $until->year)
                ->orWhere(function ($query) use ($until): void {
                    $query->where('period_year', $until->year)
                        ->where('period_month', '<=', $until->month);
                });
        })->sum('amount');
        $expense = Expense::whereDate('spent_at', '<=', $until->toDateString())->sum('amount');

        return (int) ($income - $expense);
    }

    /**
     * @return array<int, array{month: string, income: int, expense: int, balance: int}>
     */
    private function yearlySeries(int $year): array
    {
        $runningBalance = 0;

        return collect(range(1, 12))->map(function (int $month) use ($year, &$runningBalance): array {
            $income = (int) Payment::where('period_year', $year)->where('period_month', $month)->sum('amount');
            $expense = (int) Expense::whereYear('spent_at', $year)->whereMonth('spent_at', $month)->sum('amount');
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
