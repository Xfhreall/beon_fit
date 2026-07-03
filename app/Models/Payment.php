<?php

namespace App\Models;

use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['house_id', 'resident_id', 'fee_type_id', 'paid_at', 'period_month', 'period_year', 'months_paid', 'amount', 'payment_method', 'notes'])]
class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use HasFactory;

    protected $attributes = [
        'months_paid' => 1,
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'date',
            'period_month' => 'integer',
            'period_year' => 'integer',
            'months_paid' => 'integer',
            'amount' => 'integer',
        ];
    }

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }

    public function feeType(): BelongsTo
    {
        return $this->belongsTo(FeeType::class);
    }
}
