<?php

namespace App\Models;

use Database\Factories\ResidentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'phone', 'resident_status', 'marital_status', 'ktp_photo_path'])]
class Resident extends Model
{
    /** @use HasFactory<ResidentFactory> */
    use HasFactory;

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

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
