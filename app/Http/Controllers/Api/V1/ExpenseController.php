<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $month = (int) $request->integer('month', now()->month);
        $year = (int) $request->integer('year', now()->year);

        $expenses = Expense::query()
            ->with('category:id,name,is_routine')
            ->whereYear('spent_at', $year)
            ->whereMonth('spent_at', $month)
            ->when($request->string('category_id')->toString() !== '', fn ($query) => $query->where('expense_category_id', $request->string('category_id')->toString()))
            ->latest('spent_at')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return ExpenseResource::collection($expenses);
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $expense = Expense::create($this->payload($request));

        return ExpenseResource::make($expense->load('category'))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Expense $expense): ExpenseResource
    {
        return ExpenseResource::make($expense->load('category'));
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): ExpenseResource
    {
        $expense->update($this->payload($request));

        return ExpenseResource::make($expense->refresh()->load('category'));
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $expense->delete();

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(StoreExpenseRequest|UpdateExpenseRequest $request): array
    {
        $data = $request->validated();
        $data['spent_at'] = CarbonImmutable::parse((string) $data['spent_at'])->toDateTimeString();

        if ($request->hasFile('receipt')) {
            $data['receipt_path'] = $request->file('receipt')->store('expense-receipts');
        }

        unset($data['receipt']);

        return $data;
    }
}
