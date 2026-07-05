<?php

namespace App\Models;

use Database\Factories\ExpenseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property Carbon $spent_at
 */
#[Fillable(['expense_category_id', 'spent_at', 'amount', 'description', 'receipt_path', 'is_routine'])]
class Expense extends Model
{
    /** @use HasFactory<ExpenseFactory> */
    use HasFactory;

    protected $attributes = [
        'is_routine' => false,
    ];

    protected function casts(): array
    {
        return [
            'spent_at' => 'datetime:Y-m-d H:i:s',
            'amount' => 'integer',
            'is_routine' => 'boolean',
        ];
    }

    /** @return BelongsTo<ExpenseCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }
}
