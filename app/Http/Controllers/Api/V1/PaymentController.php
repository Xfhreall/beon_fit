<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\RecordPayment;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdatePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $month = (int) $request->integer('month', now()->month);
        $year = (int) $request->integer('year', now()->year);

        $payments = Payment::query()
            ->with(['house:id,number,block', 'resident:id,name', 'feeType:id,name,amount'])
            ->where('period_year', $year)
            ->where('period_month', $month)
            ->latest('paid_at')
            ->latest('payments.id')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return PaymentResource::collection($payments);
    }

    public function store(StorePaymentRequest $request, RecordPayment $recordPayment): JsonResponse
    {
        $payment = $recordPayment->store($request->validated());

        return PaymentResource::make($payment->load(['house', 'resident', 'feeType']))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Payment $payment): PaymentResource
    {
        return PaymentResource::make($payment->load(['house', 'resident', 'feeType']));
    }

    public function update(UpdatePaymentRequest $request, Payment $payment, RecordPayment $recordPayment): PaymentResource
    {
        $payment = $recordPayment->update($payment, $request->validated());

        return PaymentResource::make($payment->refresh()->load(['house', 'resident', 'feeType']));
    }

    public function destroy(Payment $payment, RecordPayment $recordPayment): JsonResponse
    {
        $recordPayment->delete($payment);

        return response()->json(null, 204);
    }
}
