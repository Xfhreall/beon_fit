<?php

namespace App\Http\Resources;

use App\Models\Occupancy;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Occupancy */
class OccupancyResource extends JsonResource
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
            'started_at' => $this->started_at->toDateString(),
            'ended_at' => $this->ended_at?->toDateString(),
            'resident_status' => $this->resident_status,
            'is_active' => $this->is_active,
            'house' => HouseResource::make($this->whenLoaded('house')),
            'resident' => ResidentResource::make($this->whenLoaded('resident')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
