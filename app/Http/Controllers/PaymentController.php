<?php

namespace App\Http\Controllers;

use App\Actions\RecordPayment;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdatePaymentRequest;
use App\Models\Bill;
use App\Models\FeeType;
use App\Models\House;
use App\Models\Payment;
use App\Models\Resident;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            'per_page' => (string) $this->perPage($request),
        ];

        return Inertia::render('payments/index', [
            'filters' => $filters,
            'payments' => Payment::query()
                ->with(['house:id,number,block', 'resident:id,name', 'feeType:id,name'])
                ->where('period_year', $filters['year'])
                ->where('period_month', $filters['month'])
                ->latest('paid_at')
                ->latest('payments.id')
                ->paginate($this->perPage($request))
                ->withQueryString(),
            'bills' => Bill::query()
                ->with(['house:id,number,block', 'resident:id,name', 'feeType:id,name,amount'])
                ->where('period_year', $filters['year'])
                ->where('period_month', $filters['month'])
                ->when($filters['status'] !== '', fn ($query) => $query->where('status', $filters['status']))
                ->orderBy('status')
                ->get(),
            'houses' => House::with('activeOccupancies.resident:id,name')->orderBy('number')->get(['id', 'number', 'block', 'status']),
            'residents' => Resident::query()
                ->with('activeOccupancies.house:id,number')
                ->whereHas('activeOccupancies')
                ->orderBy('name')
                ->get(['id', 'name', 'resident_status']),
            'feeTypes' => FeeType::where('is_active', true)->orderBy('name')->get(['id', 'name', 'amount']),
        ]);
    }

    public function store(StorePaymentRequest $request, RecordPayment $recordPayment): RedirectResponse
    {
        $payment = $recordPayment->store($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pembayaran dicatat.']);

        return to_route('payments.index', ['month' => $payment->period_month, 'year' => $payment->period_year]);
    }

    public function update(UpdatePaymentRequest $request, Payment $payment, RecordPayment $recordPayment): RedirectResponse
    {
        $recordPayment->update($payment, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pembayaran diperbarui.']);

        return to_route('payments.index', ['month' => $payment->period_month, 'year' => $payment->period_year]);
    }

    public function destroy(Payment $payment, RecordPayment $recordPayment): RedirectResponse
    {
        $month = $payment->period_month;
        $year = $payment->period_year;

        $recordPayment->delete($payment);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pembayaran dihapus.']);

        return to_route('payments.index', ['month' => $month, 'year' => $year]);
    }
}
