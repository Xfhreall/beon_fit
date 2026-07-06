<?php

namespace App\Http\Resources;

use App\Models\Resident;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Resident */
class ResidentResource extends JsonResource
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
            'name' => $this->name,
            'phone' => $this->phone,
            'resident_status' => $this->resident_status,
            'marital_status' => $this->marital_status,
            'ktp_photo_url' => $this->ktp_photo_path ? route('api.v1.residents.ktp-photo', $this->resource) : null,
            'active_occupancies' => OccupancyResource::collection($this->whenLoaded('activeOccupancies')),
            'occupancies' => OccupancyResource::collection($this->whenLoaded('occupancies')),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
