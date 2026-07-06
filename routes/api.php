<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BillController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\ExpenseCategoryController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\FeeTypeController;
use App\Http\Controllers\Api\V1\HouseController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\ResidentController;
use Illuminate\Support\Facades\Route;

Route::prefix('api/v1')->name('api.v1.')->group(function (): void {
    Route::get('csrf-token', fn () => ['csrf_token' => csrf_token()])->name('csrf-token');
    Route::post('auth/login', [AuthController::class, 'login'])->name('auth.login');
    Route::post('auth/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('auth/forgot-password', [AuthController::class, 'forgotPassword'])
        ->name('auth.forgot-password');
    Route::post('auth/reset-password', [AuthController::class, 'resetPassword'])
        ->name('auth.reset-password');

    Route::middleware('auth')->group(function (): void {
        Route::get('user', [AuthController::class, 'user'])->name('user');
        Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');

        Route::get('dashboard', DashboardController::class)->name('dashboard');
        Route::get('reports', ReportController::class)->name('reports.index');

        Route::apiResource('residents', ResidentController::class);
        Route::get('residents/{resident}/ktp-photo', [ResidentController::class, 'ktpPhoto'])->name('residents.ktp-photo');

        Route::apiResource('houses', HouseController::class);
        Route::post('houses/{house}/occupancies', [HouseController::class, 'assignResident'])->name('houses.occupancies.store');
        Route::patch('houses/{house}/occupancies/{occupancy}/end', [HouseController::class, 'endOccupancy'])->name('houses.occupancies.end');

        Route::get('fee-types', [FeeTypeController::class, 'index'])->name('fee-types.index');
        Route::patch('fee-types/{feeType}', [FeeTypeController::class, 'update'])->name('fee-types.update');
        Route::get('expense-categories', ExpenseCategoryController::class)->name('expense-categories.index');

        Route::get('bills', [BillController::class, 'index'])->name('bills.index');
        Route::post('bills/generate', [BillController::class, 'generate'])->name('bills.generate');
        Route::apiResource('payments', PaymentController::class);
        Route::apiResource('expenses', ExpenseController::class);
    });
});
