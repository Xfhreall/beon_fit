<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = [
            'month' => (int) $request->integer('month', now()->month),
            'year' => (int) $request->integer('year', now()->year),
            'category_id' => $request->string('category_id')->toString(),
            'per_page' => (string) $this->perPage($request),
        ];

        return Inertia::render('expenses/index', [
            'filters' => $filters,
            'expenses' => Expense::query()
                ->with('category:id,name,is_routine')
                ->whereYear('spent_at', $filters['year'])
                ->whereMonth('spent_at', $filters['month'])
                ->when($filters['category_id'] !== '', fn ($query) => $query->where('expense_category_id', $filters['category_id']))
                ->latest('spent_at')
                ->paginate($this->perPage($request))
                ->withQueryString(),
            'categories' => ExpenseCategory::orderBy('name')->get(['id', 'name', 'is_routine']),
        ]);
    }

    public function store(StoreExpenseRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['spent_at'] = CarbonImmutable::parse((string) $data['spent_at'])->toDateTimeString();

        if ($request->hasFile('receipt')) {
            $data['receipt_path'] = $request->file('receipt')->store('expense-receipts');
        }

        unset($data['receipt']);

        Expense::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengeluaran dicatat.']);

        return to_route('expenses.index', [
            'month' => date('n', strtotime((string) $data['spent_at'])),
            'year' => date('Y', strtotime((string) $data['spent_at'])),
        ]);
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): RedirectResponse
    {
        $data = $request->validated();
        $data['spent_at'] = CarbonImmutable::parse((string) $data['spent_at'])->toDateTimeString();

        if ($request->hasFile('receipt')) {
            $data['receipt_path'] = $request->file('receipt')->store('expense-receipts');
        }

        unset($data['receipt']);

        $expense->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengeluaran diperbarui.']);

        return to_route('expenses.index', [
            'month' => date('n', strtotime((string) $expense->spent_at)),
            'year' => date('Y', strtotime((string) $expense->spent_at)),
        ]);
    }

    public function destroy(Expense $expense): RedirectResponse
    {
        $month = $expense->spent_at->month;
        $year = $expense->spent_at->year;

        $expense->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengeluaran dihapus.']);

        return to_route('expenses.index', ['month' => $month, 'year' => $year]);
    }
}
