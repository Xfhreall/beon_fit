<?php

namespace Database\Factories;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'expense_category_id' => ExpenseCategory::factory(),
            'spent_at' => now()->toDateString(),
            'amount' => fake()->numberBetween(25000, 500000),
            'description' => fake()->sentence(),
            'receipt_path' => null,
            'is_routine' => fake()->boolean(),
        ];
    }
}
