<?php

namespace App\Actions;

use App\Models\FeeType;
use App\Models\House;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class GenerateMonthlyBills
{
    public function handle(int $periodMonth, int $periodYear): int
    {
        $period = CarbonImmutable::create($periodYear, $periodMonth, 1);
        $feeTypes = FeeType::where('is_active', true)->get();
        $created = 0;

        DB::transaction(function () use ($period, $feeTypes, &$created): void {
            House::query()
                ->with(['activeOccupancies.resident'])
                ->where('status', 'dihuni')
                ->each(function (House $house) use ($period, $feeTypes, &$created): void {
                    $occupancy = $house->activeOccupancies
                        ->first(fn ($occupancy): bool => $occupancy->started_at->lte($period->endOfMonth())
                            && ($occupancy->ended_at === null || $occupancy->ended_at->gte($period->startOfMonth())));

                    if ($occupancy === null) {
                        return;
                    }

                    foreach ($feeTypes as $feeType) {
                        $bill = $house->bills()->firstOrCreate([
                            'fee_type_id' => $feeType->id,
                            'period_month' => (int) $period->month,
                            'period_year' => (int) $period->year,
                        ], [
                            'resident_id' => $occupancy->resident_id,
                            'amount_due' => $feeType->amount,
                            'amount_paid' => 0,
                            'status' => 'belum_lunas',
                        ]);

                        if ($bill->wasRecentlyCreated) {
                            $created++;
                        }
                    }
                });
        });

        return $created;
    }
}
