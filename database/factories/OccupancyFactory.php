<?php

namespace Database\Factories;

use App\Models\House;
use App\Models\Occupancy;
use App\Models\Resident;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Occupancy>
 */
class OccupancyFactory extends Factory
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
            'started_at' => now()->startOfYear()->toDateString(),
            'ended_at' => null,
            'resident_status' => 'tetap',
            'is_active' => true,
        ];
    }
}
