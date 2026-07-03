<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdatePaymentRequest;
use App\Models\Bill;
use App\Models\FeeType;
use App\Models\House;
use App\Models\Payment;
use App\Models\Resident;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = [
            'month' => (int) $request->integer('month', now()->month),
            'year' => (int) $request->integer('year', now()->year),
            'status' => $request->string('status')->toString(),
        ];

        return Inertia::render('payments/index', [
            'filters' => $filters,
            'payments' => Payment::query()
                ->with(['house:id,number,block', 'resident:id,name', 'feeType:id,name'])
                ->where('period_year', $filters['year'])
                ->where('period_month', $filters['month'])
                ->latest('paid_at')
                ->paginate(12)
                ->withQueryString(),
            'bills' => Bill::query()
                ->with(['house:id,number,block', 'resident:id,name', 'feeType:id,name,amount'])
                ->where('period_year', $filters['year'])
                ->where('period_month', $filters['month'])
                ->when($filters['status'] !== '', fn ($query) => $query->where('status', $filters['status']))
                ->orderBy('status')
                ->paginate(12, ['*'], 'bills_page')
                ->withQueryString(),
            'houses' => House::with('activeOccupancies.resident:id,name')->orderBy('number')->get(['id', 'number', 'block', 'status']),
            'residents' => Resident::query()
                ->with('activeOccupancies.house:id,number')
                ->whereHas('activeOccupancies')
                ->orderBy('name')
                ->get(['id', 'name', 'resident_status']),
            'feeTypes' => FeeType::where('is_active', true)->orderBy('name')->get(['id', 'name', 'amount']),
        ]);
    }

    public function store(StorePaymentRequest $request): RedirectResponse
    {
        $payment = DB::transaction(function () use ($request): Payment {
            $this->assertResidentOccupiesHouse($request->validated());

            $payment = Payment::create($request->validated());
            $this->ensureBillsExist($payment);
            $this->recalculateBills($payment);

            return $payment;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pembayaran dicatat.']);

        return to_route('payments.index', ['month' => $payment->period_month, 'year' => $payment->period_year]);
    }

    public function update(UpdatePaymentRequest $request, Payment $payment): RedirectResponse
    {
        DB::transaction(function () use ($request, $payment): void {
            $payment->update($request->validated());
            $this->recalculateBills($payment);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pembayaran diperbarui.']);

        return to_route('payments.index', ['month' => $payment->period_month, 'year' => $payment->period_year]);
    }

    public function destroy(Payment $payment): RedirectResponse
    {
        $month = $payment->period_month;
        $year = $payment->period_year;

        DB::transaction(function () use ($payment): void {
            $context = $payment->replicate();
            $context->setAttribute('house_id', $payment->house_id);
            $context->setAttribute('fee_type_id', $payment->fee_type_id);
            $context->setAttribute('period_month', $payment->period_month);
            $context->setAttribute('period_year', $payment->period_year);
            $context->setAttribute('months_paid', $payment->months_paid);

            $payment->delete();
            $this->recalculateBills($context);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pembayaran dihapus.']);

        return to_route('payments.index', ['month' => $month, 'year' => $year]);
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
