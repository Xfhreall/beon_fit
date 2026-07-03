<?php

namespace Database\Seeders;

use App\Models\House;
use Illuminate\Database\Seeder;

class HouseSeeder extends Seeder
{
    public function run(): void
    {
        collect(range(1, 20))->each(function (int $number): void {
            House::firstOrCreate([
                'number' => 'RT-'.str_pad((string) $number, 2, '0', STR_PAD_LEFT),
            ], [
                'block' => $number <= 10 ? 'A' : 'B',
                'status' => $number <= 15 ? 'dihuni' : 'tidak_dihuni',
            ]);
        });
    }
}
