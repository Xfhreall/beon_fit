<?php

namespace App\Http\Resources;

use App\Models\House;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin House */
class HouseResource extends JsonResource
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
            'number' => $this->number,
            'block' => $this->block,
            'status' => $this->status,
            'notes' => $this->notes,
            'unpaid_bills_count' => $this->whenCounted('unpaid_bills'),
            'active_occupancies' => OccupancyResource::collection($this->whenLoaded('activeOccupancies')),
            'occupancies' => OccupancyResource::collection($this->whenLoaded('occupancies')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
