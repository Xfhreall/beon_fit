<?php

namespace Database\Factories;

use App\Models\House;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<House>
 */
class HouseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'number' => fake()->unique()->bothify('A-##'),
            'block' => fake()->randomElement(['A', 'B', 'C']),
            'status' => 'tidak_dihuni',
            'notes' => null,
        ];
    }
}
