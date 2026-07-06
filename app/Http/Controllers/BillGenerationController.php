<?php

namespace App\Http\Controllers;

use App\Actions\GenerateMonthlyBills;
use App\Http\Requests\GenerateBillsRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class BillGenerationController extends Controller
{
    public function __invoke(GenerateBillsRequest $request, GenerateMonthlyBills $generateMonthlyBills): RedirectResponse
    {
        $data = $request->validated();
        $created = $generateMonthlyBills->handle((int) $data['period_month'], (int) $data['period_year']);

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$created} tagihan dibuat."]);

        return to_route('payments.index');
    }
}
