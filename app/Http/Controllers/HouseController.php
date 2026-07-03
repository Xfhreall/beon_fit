<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreHouseRequest;
use App\Http\Requests\StoreOccupancyRequest;
use App\Http\Requests\UpdateHouseRequest;
use App\Models\House;
use App\Models\Occupancy;
use App\Models\Resident;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class HouseController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = [
            'search' => $request->string('search')->toString(),
            'status' => $request->string('status')->toString(),
        ];

        $houses = House::query()
            ->with(['activeOccupancies.resident:id,name,resident_status', 'occupancies.resident:id,name'])
            ->withCount(['bills as unpaid_bills_count' => fn ($query) => $query->whereIn('status', ['belum_lunas', 'sebagian'])])
            ->when($filters['search'] !== '', fn ($query) => $query->where(function ($query) use ($filters): void {
                $query->where('number', 'like', "%{$filters['search']}%")
                    ->orWhere('block', 'like', "%{$filters['search']}%");
            }))
            ->when($filters['status'] !== '', fn ($query) => $query->where('status', $filters['status']))
            ->orderBy('number')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('houses/index', [
            'houses' => $houses,
            'filters' => $filters,
            'residents' => Resident::orderBy('name')->get(['id', 'name', 'resident_status']),
        ]);
    }

    public function store(StoreHouseRequest $request): RedirectResponse
    {
        House::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Rumah ditambahkan.']);

        return to_route('houses.index');
    }

    public function update(UpdateHouseRequest $request, House $house): RedirectResponse
    {
        $house->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Rumah diperbarui.']);

        return to_route('houses.index');
    }

    public function assignResident(StoreOccupancyRequest $request, House $house): RedirectResponse
    {
        DB::transaction(function () use ($request, $house): void {
            $house->activeOccupancies()->update([
                'is_active' => false,
                'ended_at' => $request->date('started_at')->subDay()->toDateString(),
            ]);

            $house->occupancies()->create([
                ...$request->validated(),
                'is_active' => $request->date('ended_at') === null,
            ]);

            $house->update(['status' => 'dihuni']);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Penghuni rumah ditetapkan.']);

        return to_route('houses.index');
    }

    public function endOccupancy(House $house, Occupancy $occupancy): RedirectResponse
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

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Masa tinggal diakhiri.']);

        return to_route('houses.index');
    }

    public function destroy(House $house): RedirectResponse
    {
        $house->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Rumah dihapus.']);

        return to_route('houses.index');
    }
}
