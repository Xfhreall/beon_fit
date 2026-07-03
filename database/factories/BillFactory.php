<?php

namespace Database\Factories;

use App\Models\Bill;
use App\Models\FeeType;
use App\Models\House;
use App\Models\Resident;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Bill>
 */
class BillFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'house_id' => House::factory(),
            'resident_id' => Resident::factory(),
            'fee_type_id' => FeeType::factory(),
            'period_month' => now()->month,
            'period_year' => now()->year,
            'amount_due' => 100000,
            'amount_paid' => 0,
            'status' => 'belum_lunas',
        ];
    }
}
