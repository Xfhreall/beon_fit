<?php

namespace App\Http\Resources;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Payment */
class PaymentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'house_id' => $this->house_id,
            'resident_id' => $this->resident_id,
            'fee_type_id' => $this->fee_type_id,
            'paid_at' => $this->paid_at,
            'period_month' => $this->period_month,
            'period_year' => $this->period_year,
            'months_paid' => $this->months_paid,
            'amount' => $this->amount,
            'payment_method' => $this->payment_method,
            'notes' => $this->notes,
            'house' => HouseResource::make($this->whenLoaded('house')),
            'resident' => ResidentResource::make($this->whenLoaded('resident')),
            'fee_type' => FeeTypeResource::make($this->whenLoaded('feeType')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
