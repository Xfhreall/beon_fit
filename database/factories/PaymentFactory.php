<?php

namespace Database\Factories;

use App\Models\FeeType;
use App\Models\House;
use App\Models\Payment;
use App\Models\Resident;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
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
            'paid_at' => now()->toDateString(),
            'period_month' => now()->month,
            'period_year' => now()->year,
            'months_paid' => 1,
            'amount' => 100000,
            'payment_method' => fake()->randomElement(['tunai', 'transfer']),
            'notes' => null,
        ];
    }
}
