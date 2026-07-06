<?php

namespace App\Http\Resources;

use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Expense */
class ExpenseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'expense_category_id' => $this->expense_category_id,
            'spent_at' => $this->spent_at->toDateTimeString(),
            'amount' => $this->amount,
            'description' => $this->description,
            'receipt_path' => $this->receipt_path,
            'is_routine' => $this->is_routine,
            'category' => ExpenseCategoryResource::make($this->whenLoaded('category')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
