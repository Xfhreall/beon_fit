<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateFeeTypeRequest;
use App\Http\Resources\FeeTypeResource;
use App\Models\FeeType;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FeeTypeController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return FeeTypeResource::collection(FeeType::orderBy('name')->get());
    }

    public function update(UpdateFeeTypeRequest $request, FeeType $feeType): FeeTypeResource
    {
        $feeType->update($request->validated());

        return FeeTypeResource::make($feeType->refresh());
    }
}
