<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHouseRequest;
use App\Http\Requests\StoreOccupancyRequest;
use App\Http\Requests\UpdateHouseRequest;
use App\Http\Resources\HouseResource;
use App\Http\Resources\OccupancyResource;
use App\Models\House;
use App\Models\Occupancy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class HouseController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $houses = House::query()
            ->with(['activeOccupancies.resident:id,name,resident_status', 'occupancies.resident:id,name'])
            ->withCount(['bills as unpaid_bills_count' => fn ($query) => $query->whereIn('status', ['belum_lunas', 'sebagian'])])
            ->when($request->string('search')->toString() !== '', fn ($query) => $query->where(function ($query) use ($request): void {
                $search = $request->string('search')->toString();
                $query->where('number', 'like', "%{$search}%")
                    ->orWhere('block', 'like', "%{$search}%");
            }))
            ->when($request->string('status')->toString() !== '', fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->orderBy('number')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return HouseResource::collection($houses);
    }

    public function store(StoreHouseRequest $request): JsonResponse
    {
        return HouseResource::make(House::create($request->validated()))
            ->response()
            ->setStatusCode(201);
    }

    public function show(House $house): HouseResource
    {
        return HouseResource::make($house->load(['activeOccupancies.resident', 'occupancies.resident']));
    }

    public function update(UpdateHouseRequest $request, House $house): HouseResource
    {
        $house->update($request->validated());

        return HouseResource::make($house->refresh()->load('activeOccupancies.resident'));
    }

    public function destroy(House $house): JsonResponse
    {
        $house->delete();

        return response()->json(null, 204);
    }

    public function assignResident(StoreOccupancyRequest $request, House $house): JsonResponse
    {
        $occupancy = DB::transaction(function () use ($request, $house): Occupancy {
            $house->activeOccupancies()->update([
                'is_active' => false,
                'ended_at' => $request->date('started_at')->subDay()->toDateString(),
            ]);

            $occupancy = $house->occupancies()->create([
                ...$request->validated(),
                'is_active' => $request->date('ended_at') === null,
            ]);

            $house->update(['status' => 'dihuni']);

            return $occupancy;
        });

        return OccupancyResource::make($occupancy->load(['house', 'resident']))
            ->response()
            ->setStatusCode(201);
    }

    public function endOccupancy(House $house, Occupancy $occupancy): OccupancyResource
    {
        abort_unless($occupancy->house_id === $house->id, 404);

        DB::transaction(function () use ($house, $occupancy): void {
            $occupancy->update([
                'is_active' => false,
                'ended_at' => now()->toDateString(),
            ]);

            if (! $house->activeOccupancies()->exists()) {
                $house->update(['status' => 'tidak_dihuni']);
            }
        });

        return OccupancyResource::make($occupancy->refresh()->load(['house', 'resident']));
    }
}
