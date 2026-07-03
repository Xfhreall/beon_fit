<?php

namespace App\Http\Controllers;

use App\Http\Requests\GenerateBillsRequest;
use App\Models\FeeType;
use App\Models\House;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BillGenerationController extends Controller
{
    public function __invoke(GenerateBillsRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $period = CarbonImmutable::create((int) $data['period_year'], (int) $data['period_month'], 1);
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

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$created} tagihan dibuat."]);

        return to_route('payments.index');
    }
}
