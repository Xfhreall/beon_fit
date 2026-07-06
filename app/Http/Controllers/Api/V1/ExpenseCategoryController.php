<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExpenseCategoryResource;
use App\Models\ExpenseCategory;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseCategoryController extends Controller
{
    public function __invoke(): AnonymousResourceCollection
    {
        return ExpenseCategoryResource::collection(ExpenseCategory::orderBy('name')->get());
    }
}
