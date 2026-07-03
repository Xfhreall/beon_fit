<?php

namespace Database\Seeders;

use App\Models\House;
use App\Models\Resident;
use Illuminate\Database\Seeder;

class ResidentSeeder extends Seeder
{
    public function run(): void
    {
        House::orderBy('number')->limit(15)->get()->each(function (House $house, int $index): void {
            $resident = Resident::factory()->create([
                'name' => 'Warga '.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
                'resident_status' => $index < 12 ? 'tetap' : 'kontrak',
                'marital_status' => $index % 3 === 0 ? 'belum_menikah' : 'menikah',
            ]);

            $house->occupancies()->create([
                'resident_id' => $resident->id,
                'started_at' => now()->startOfYear()->toDateString(),
                'resident_status' => $resident->resident_status,
                'is_active' => true,
            ]);
        });
    }
}
