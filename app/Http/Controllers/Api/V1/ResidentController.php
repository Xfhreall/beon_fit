<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreResidentRequest;
use App\Http\Requests\UpdateResidentRequest;
use App\Http\Resources\ResidentResource;
use App\Models\Occupancy;
use App\Models\Resident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ResidentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $residents = Resident::query()
            ->with(['activeOccupancies.house:id,number,block'])
            ->when($request->string('search')->toString() !== '', fn ($query) => $query->where(function ($query) use ($request): void {
                $search = $request->string('search')->toString();
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            }))
            ->when($request->string('resident_status')->toString() !== '', fn ($query) => $query->where('resident_status', $request->string('resident_status')->toString()))
            ->when($request->string('marital_status')->toString() !== '', fn ($query) => $query->where('marital_status', $request->string('marital_status')->toString()))
            ->latest()
            ->paginate($this->perPage($request))
            ->withQueryString();

        return ResidentResource::collection($residents);
    }

    public function store(StoreResidentRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('ktp_photo')) {
            $data['ktp_photo_path'] = $request->file('ktp_photo')->store('resident-ktp');
        }

        unset($data['ktp_photo']);

        return ResidentResource::make(Resident::create($data)->load('activeOccupancies.house'))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Resident $resident): ResidentResource
    {
        return ResidentResource::make($resident->load(['activeOccupancies.house', 'occupancies.house']));
    }

    public function update(UpdateResidentRequest $request, Resident $resident): ResidentResource
    {
        $data = $request->validated();

        if ($request->hasFile('ktp_photo')) {
            $data['ktp_photo_path'] = $request->file('ktp_photo')->store('resident-ktp');
        }

        unset($data['ktp_photo']);

        $resident->update($data);

        return ResidentResource::make($resident->refresh()->load('activeOccupancies.house'));
    }

    public function destroy(Resident $resident): JsonResponse
    {
        Occupancy::whereBelongsTo($resident)->update([
            'is_active' => false,
            'ended_at' => now()->toDateString(),
        ]);
        $resident->delete();

        return response()->json(null, 204);
    }

    public function ktpPhoto(Resident $resident): BinaryFileResponse
    {
        abort_if($resident->ktp_photo_path === null, 404);
        abort_unless(Storage::exists($resident->ktp_photo_path), 404);

        return response()->file(Storage::path($resident->ktp_photo_path));
    }
}
