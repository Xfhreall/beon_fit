<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateFeeTypeRequest;
use App\Models\FeeType;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class FeeTypeController extends Controller
{
    public function update(UpdateFeeTypeRequest $request, FeeType $feeType): RedirectResponse
    {
        $feeType->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Nominal iuran diperbarui.']);

        return to_route('payments.index');
    }
}
