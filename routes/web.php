<?php

use App\Http\Controllers\BillGenerationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\HouseController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ResidentController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::resource('residents', ResidentController::class)->except(['create', 'edit']);
    Route::get('residents/{resident}/ktp-photo', [ResidentController::class, 'ktpPhoto'])->name('residents.ktp-photo');
    Route::resource('houses', HouseController::class)->except(['create', 'edit', 'show']);
    Route::post('houses/{house}/occupancies', [HouseController::class, 'assignResident'])->name('houses.occupancies.store');
    Route::patch('houses/{house}/occupancies/{occupancy}/end', [HouseController::class, 'endOccupancy'])->name('houses.occupancies.end');
    Route::resource('payments', PaymentController::class)->except(['create', 'edit', 'show']);
    Route::resource('expenses', ExpenseController::class)->except(['create', 'edit', 'show']);
    Route::post('bills/generate', BillGenerationController::class)->name('bills.generate');
    Route::get('reports', ReportController::class)->name('reports.index');
});

require __DIR__.'/settings.php';
