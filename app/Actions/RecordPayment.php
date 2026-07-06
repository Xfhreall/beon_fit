<?php

namespace App\Actions;

use App\Models\Bill;
use App\Models\FeeType;
use App\Models\House;
use App\Models\Payment;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordPayment
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function store(array $data): Payment
    {
        return DB::transaction(function () use ($data): Payment {
            $data['paid_at'] = CarbonImmutable::parse((string) $data['paid_at'])->toDateTimeString();

            $this->assertResidentOccupiesHouse($data);
            $this->assertBillsCanReceivePayment(new Payment($data));

            $payment = Payment::create($data);
            $this->ensureBillsExist($payment);
            $this->recalculateBills($payment);

            return $payment;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Payment $payment, array $data): Payment
    {
        return DB::transaction(function () use ($payment, $data): Payment {
            $data['paid_at'] = CarbonImmutable::parse((string) $data['paid_at'])->toDateTimeString();

            $payment->fill($data);
            $this->assertBillsCanReceivePayment($payment, $payment);
            $payment->save();
            $this->recalculateBills($payment);

            return $payment;
        });
    }

    public function delete(Payment $payment): void
    {
        DB::transaction(function () use ($payment): void {
            $context = $payment->replicate();

            $payment->delete();
            $this->recalculateBills($context);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function assertResidentOccupiesHouse(array $data): void
    {
        $period = CarbonImmutable::create((int) $data['period_year'], (int) $data['period_month'], 1);

        $exists = House::whereKey($data['house_id'])
            ->whereHas('occupancies', function ($query) use ($data, $period): void {
                $query->where('resident_id', $data['resident_id'])
                    ->where('started_at', '<=', $period->endOfMonth()->toDateString())
                    ->where(function ($query) use ($period): void {
                        $query->whereNull('ended_at')
                            ->orWhere('ended_at', '>=', $period->startOfMonth()->toDateString());
                    });
            })
            ->exists();

        if (! $exists) {
            throw ValidationException::withMessages([
                'resident_id' => 'Penghuni harus aktif pada rumah untuk periode tagihan.',
            ]);
        }
    }

    private function ensureBillsExist(Payment $payment): void
    {
        $feeType = FeeType::findOrFail($payment->fee_type_id);

        foreach ($this->paymentPeriods($payment) as $period) {
            Bill::firstOrCreate([
                'house_id' => $payment->house_id,
                'fee_type_id' => $payment->fee_type_id,
                'period_month' => $period['month'],
                'period_year' => $period['year'],
            ], [
                'resident_id' => $payment->resident_id,
                'amount_due' => $feeType->amount,
                'amount_paid' => 0,
                'status' => 'belum_lunas',
            ]);
        }
    }

    private function assertBillsCanReceivePayment(Payment $payment, ?Payment $ignoredPayment = null): void
    {
        foreach ($this->paymentPeriods($payment) as $period) {
            $bill = Bill::where('house_id', $payment->house_id)
                ->where('fee_type_id', $payment->fee_type_id)
                ->where('period_month', $period['month'])
                ->where('period_year', $period['year'])
                ->first();

            if ($bill === null) {
                continue;
            }

            $paid = Payment::where('house_id', $payment->house_id)
                ->where('fee_type_id', $payment->fee_type_id)
                ->when($ignoredPayment?->exists, fn ($query) => $query->whereKeyNot($ignoredPayment->id))
                ->get()
                ->sum(fn (Payment $storedPayment): int => $this->allocatedAmountForPeriod($storedPayment, $period['year'], $period['month']));

            if ($paid + $this->allocatedAmountForPeriod($payment, $period['year'], $period['month']) > $bill->amount_due) {
                throw ValidationException::withMessages([
                    'amount' => 'Tagihan periode ini sudah lunas atau nominal melebihi sisa tagihan.',
                ]);
            }
        }
    }

    private function recalculateBills(Payment $payment): void
    {
        foreach ($this->paymentPeriods($payment) as $period) {
            $bill = Bill::where('house_id', $payment->house_id)
                ->where('fee_type_id', $payment->fee_type_id)
                ->where('period_month', $period['month'])
                ->where('period_year', $period['year'])
                ->first();

            if ($bill === null) {
                continue;
            }

            $paid = Payment::where('house_id', $payment->house_id)
                ->where('fee_type_id', $payment->fee_type_id)
                ->get()
                ->sum(fn (Payment $storedPayment): int => $this->allocatedAmountForPeriod($storedPayment, $period['year'], $period['month']));

            $bill->update([
                'amount_paid' => $paid,
                'status' => $paid <= 0 ? 'belum_lunas' : ($paid >= $bill->amount_due ? 'lunas' : 'sebagian'),
            ]);
        }
    }

    /**
     * @return array<int, array{year: int, month: int}>
     */
    private function paymentPeriods(Payment $payment): array
    {
        $start = CarbonImmutable::create($payment->period_year, $payment->period_month, 1);

        return collect(range(0, $payment->months_paid - 1))
            ->map(fn (int $offset): array => [
                'year' => (int) $start->addMonths($offset)->year,
                'month' => (int) $start->addMonths($offset)->month,
            ])
            ->all();
    }

    private function allocatedAmountForPeriod(Payment $payment, int $year, int $month): int
    {
        $periods = $this->paymentPeriods($payment);
        $index = collect($periods)->search(fn (array $period): bool => $period['year'] === $year && $period['month'] === $month);

        if ($index === false) {
            return 0;
        }

        $base = intdiv($payment->amount, $payment->months_paid);
        $remainder = $payment->amount % $payment->months_paid;

        return $base + ($index === count($periods) - 1 ? $remainder : 0);
    }
}
