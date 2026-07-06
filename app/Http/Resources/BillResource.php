<?php

namespace App\Http\Resources;

use App\Models\Bill;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Bill */
class BillResource extends JsonResource
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
            'period_month' => $this->period_month,
            'period_year' => $this->period_year,
            'amount_due' => $this->amount_due,
            'amount_paid' => $this->amount_paid,
            'status' => $this->status,
            'house' => HouseResource::make($this->whenLoaded('house')),
            'resident' => ResidentResource::make($this->whenLoaded('resident')),
            'fee_type' => FeeTypeResource::make($this->whenLoaded('feeType')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
