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

    public function occupancies(): HasMany
    {
        return $this->hasMany(Occupancy::class);
    }

    public function activeOccupancies(): HasMany
    {
        return $this->hasMany(Occupancy::class)->where('is_active', true);
    }

    public function bills(): HasMany
    {
        return $this->hasMany(Bill::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
