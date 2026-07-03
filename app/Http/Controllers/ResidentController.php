<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreResidentRequest;
use App\Http\Requests\UpdateResidentRequest;
use App\Models\Occupancy;
use App\Models\Resident;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ResidentController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = [
            'search' => $request->string('search')->toString(),
            'resident_status' => $request->string('resident_status')->toString(),
            'marital_status' => $request->string('marital_status')->toString(),
        ];

        $residents = Resident::query()
            ->with(['activeOccupancies.house:id,number,block'])
            ->when($filters['search'] !== '', fn ($query) => $query->where(function ($query) use ($filters): void {
                $query->where('name', 'like', "%{$filters['search']}%")
                    ->orWhere('phone', 'like', "%{$filters['search']}%");
            }))
            ->when($filters['resident_status'] !== '', fn ($query) => $query->where('resident_status', $filters['resident_status']))
            ->when($filters['marital_status'] !== '', fn ($query) => $query->where('marital_status', $filters['marital_status']))
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('residents/index', [
            'residents' => $residents,
            'filters' => $filters,
        ]);
    }

    public function store(StoreResidentRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('ktp_photo')) {
            $data['ktp_photo_path'] = $request->file('ktp_photo')->store('resident-ktp');
        }

        unset($data['ktp_photo']);

        Resident::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Penghuni ditambahkan.']);

        return to_route('residents.index');
    }

    public function show(Resident $resident): Response
    {
        return Inertia::render('residents/show', [
            'resident' => $resident->load(['occupancies.house:id,number,block']),
        ]);
    }

    public function update(UpdateResidentRequest $request, Resident $resident): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('ktp_photo')) {
            $data['ktp_photo_path'] = $request->file('ktp_photo')->store('resident-ktp');
        }

        unset($data['ktp_photo']);

        $resident->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Penghuni diperbarui.']);

        return to_route('residents.index');
    }

    public function destroy(Resident $resident): RedirectResponse
    {
        Occupancy::whereBelongsTo($resident)->update([
            'is_active' => false,
            'ended_at' => now()->toDateString(),
        ]);
        $resident->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Penghuni dihapus.']);

        return to_route('residents.index');
    }
}
