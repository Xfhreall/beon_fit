<?php

namespace Database\Factories;

use App\Models\Resident;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Resident>
 */
class ResidentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'phone' => '08'.fake()->numerify('##########'),
            'resident_status' => fake()->randomElement(['tetap', 'kontrak']),
            'marital_status' => fake()->randomElement(['menikah', 'belum_menikah']),
            'ktp_photo_path' => null,
        ];
    }
}
