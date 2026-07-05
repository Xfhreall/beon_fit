<?php

namespace App\Models;

use Database\Factories\HouseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['number', 'block', 'status', 'notes'])]
class House extends Model
{
    /** @use HasFactory<HouseFactory> */
    use HasFactory;

    protected $attributes = [
        'status' => 'tidak_dihuni',
    ];

    /** @return HasMany<Occupancy, $this> */
    public function occupancies(): HasMany
    {
        return $this->hasMany(Occupancy::class);
    }

    /** @return HasMany<Occupancy, $this> */
    public function activeOccupancies(): HasMany
    {
        return $this->hasMany(Occupancy::class)->where('is_active', true);
    }

    /** @return HasMany<Bill, $this> */
    public function bills(): HasMany
    {
        return $this->hasMany(Bill::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
