<?php

namespace App\Models;

use Database\Factories\BillFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['house_id', 'resident_id', 'fee_type_id', 'period_month', 'period_year', 'amount_due', 'amount_paid', 'status'])]
class Bill extends Model
{
    /** @use HasFactory<BillFactory> */
    use HasFactory;

    protected $attributes = [
        'amount_paid' => 0,
        'status' => 'belum_lunas',
    ];

    protected function casts(): array
    {
        return [
            'period_month' => 'integer',
            'period_year' => 'integer',
            'amount_due' => 'integer',
            'amount_paid' => 'integer',
        ];
    }

    /** @return BelongsTo<House, $this> */
    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    /** @return BelongsTo<Resident, $this> */
    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }

    /** @return BelongsTo<FeeType, $this> */
    public function feeType(): BelongsTo
    {
        return $this->belongsTo(FeeType::class);
    }
}
