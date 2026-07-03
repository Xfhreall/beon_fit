<?php

namespace Database\Seeders;

use App\Models\Bill;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\FeeType;
use App\Models\House;
use App\Models\Payment;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

class FinanceSeeder extends Seeder
{
    public function run(): void
    {
        $security = FeeType::firstOrCreate(
            ['code' => 'satpam'],
            ['name' => 'Iuran Satpam', 'amount' => 100000, 'is_active' => true],
        );
        $cleaning = FeeType::firstOrCreate(
            ['code' => 'kebersihan'],
            ['name' => 'Iuran Kebersihan', 'amount' => 15000, 'is_active' => true],
        );

        collect([
            ['Gaji satpam', true],
            ['Token listrik pos satpam', true],
            ['Perbaikan jalan', false],
            ['Perbaikan selokan', false],
            ['Kebersihan', true],
            ['Lainnya', false],
        ])->each(fn (array $category): ExpenseCategory => ExpenseCategory::firstOrCreate([
            'name' => $category[0],
        ], [
            'is_routine' => $category[1],
        ]));

        $period = CarbonImmutable::now()->startOfMonth();

        House::with('activeOccupancies.resident')
            ->where('status', 'dihuni')
            ->get()
            ->each(function (House $house) use ($period, $security, $cleaning): void {
                $occupancy = $house->activeOccupancies->first();

                if ($occupancy === null) {
                    return;
                }

                foreach ([$security, $cleaning] as $feeType) {
                    Bill::firstOrCreate([
                        'house_id' => $house->id,
                        'fee_type_id' => $feeType->id,
                        'period_month' => (int) $period->month,
                        'period_year' => (int) $period->year,
                    ], [
                        'resident_id' => $occupancy->resident_id,
                        'amount_due' => $feeType->amount,
                        'amount_paid' => 0,
                        'status' => 'belum_lunas',
                    ]);
                }
            });

        Bill::with(['house.activeOccupancies', 'feeType'])->limit(18)->get()->each(function (Bill $bill): void {
            $residentId = $bill->resident_id ?? $bill->house->activeOccupancies->first()?->resident_id;

            if ($residentId === null) {
                return;
            }

            Payment::create([
                'house_id' => $bill->house_id,
                'resident_id' => $residentId,
                'fee_type_id' => $bill->fee_type_id,
                'paid_at' => now()->toDateString(),
                'period_month' => $bill->period_month,
                'period_year' => $bill->period_year,
                'months_paid' => 1,
                'amount' => $bill->amount_due,
                'payment_method' => 'transfer',
            ]);

            $bill->update([
                'amount_paid' => $bill->amount_due,
                'status' => 'lunas',
            ]);
        });

        $salary = ExpenseCategory::where('name', 'Gaji satpam')->firstOrFail();
        $cleaningCategory = ExpenseCategory::where('name', 'Kebersihan')->firstOrFail();

        Expense::firstOrCreate([
            'expense_category_id' => $salary->id,
            'spent_at' => now()->startOfMonth()->toDateString(),
            'description' => 'Gaji satpam bulan berjalan',
        ], [
            'amount' => 2000000,
            'is_routine' => true,
        ]);

        Expense::firstOrCreate([
            'expense_category_id' => $cleaningCategory->id,
            'spent_at' => now()->startOfMonth()->addDays(5)->toDateString(),
            'description' => 'Peralatan kebersihan lingkungan',
        ], [
            'amount' => 250000,
            'is_routine' => true,
        ]);
    }
}
