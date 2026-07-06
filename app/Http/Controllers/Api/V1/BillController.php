<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\GenerateMonthlyBills;
use App\Http\Controllers\Controller;
use App\Http\Requests\GenerateBillsRequest;
use App\Http\Resources\BillResource;
use App\Models\Bill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BillController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $month = (int) $request->integer('month', now()->month);
        $year = (int) $request->integer('year', now()->year);

        $bills = Bill::query()
            ->with(['house:id,number,block', 'resident:id,name', 'feeType:id,name,amount'])
            ->where('period_year', $year)
            ->where('period_month', $month)
            ->when($request->string('status')->toString() !== '', fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->orderBy('status')
            ->orderBy('house_id')
            ->get();

        return BillResource::collection($bills);
    }

    public function generate(GenerateBillsRequest $request, GenerateMonthlyBills $generateMonthlyBills): JsonResponse
    {
        $data = $request->validated();

        return response()->json([
            'data' => [
                'created' => $generateMonthlyBills->handle((int) $data['period_month'], (int) $data['period_year']),
            ],
        ]);
    }
}
