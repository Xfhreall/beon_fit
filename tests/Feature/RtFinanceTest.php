<?php

use App\Models\Bill;
use App\Models\ExpenseCategory;
use App\Models\FeeType;
use App\Models\House;
use App\Models\Resident;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('dashboard is rendered with finance summary', function () {
    $this->actingAs(User::factory()->create());

    $this->get(route('dashboard'))->assertOk();
});

test('monthly bills are generated only for occupied houses', function () {
    $this->actingAs(User::factory()->create());

    $fee = FeeType::factory()->create(['amount' => 100000]);
    $occupied = House::factory()->create(['status' => 'dihuni']);
    House::factory()->create(['status' => 'tidak_dihuni']);
    $resident = Resident::factory()->create(['resident_status' => 'tetap']);

    $occupied->occupancies()->create([
        'resident_id' => $resident->id,
        'started_at' => now()->startOfYear()->toDateString(),
        'resident_status' => 'tetap',
        'is_active' => true,
    ]);

    $this->post(route('bills.generate'), [
        'period_month' => 7,
        'period_year' => 2026,
    ])->assertRedirect(route('payments.index'));

    expect(Bill::count())->toBe(1)
        ->and(Bill::first()->fee_type_id)->toBe($fee->id);
});

test('payment updates bill status to paid', function () {
    $this->actingAs(User::factory()->create());

    $fee = FeeType::factory()->create(['amount' => 100000]);
    $house = House::factory()->create(['status' => 'dihuni']);
    $resident = Resident::factory()->create();
    $house->occupancies()->create([
        'resident_id' => $resident->id,
        'started_at' => '2026-01-01',
        'resident_status' => 'tetap',
        'is_active' => true,
    ]);
    $bill = Bill::factory()->create([
        'house_id' => $house->id,
        'resident_id' => $resident->id,
        'fee_type_id' => $fee->id,
        'period_month' => 7,
        'period_year' => 2026,
        'amount_due' => 100000,
    ]);

    $this->post(route('payments.store'), [
        'house_id' => $house->id,
        'resident_id' => $resident->id,
        'fee_type_id' => $fee->id,
        'paid_at' => '2026-07-03',
        'period_month' => 7,
        'period_year' => 2026,
        'months_paid' => 1,
        'amount' => 100000,
    ])->assertRedirect(route('payments.index', ['month' => 7, 'year' => 2026]));

    expect($bill->refresh()->status)->toBe('lunas')
        ->and($bill->amount_paid)->toBe(100000);
});

test('expense can be recorded', function () {
    $this->actingAs(User::factory()->create());

    $category = ExpenseCategory::factory()->create();

    $this->post(route('expenses.store'), [
        'expense_category_id' => $category->id,
        'spent_at' => '2026-07-03',
        'amount' => 250000,
        'description' => 'Perbaikan selokan',
        'is_routine' => false,
    ])->assertRedirect(route('expenses.index', ['month' => 7, 'year' => 2026]));

    $this->assertDatabaseHas('expenses', [
        'expense_category_id' => $category->id,
        'amount' => 250000,
    ]);
});

test('resident ktp photo can be previewed from residents table', function () {
    Storage::fake('local');
    $this->actingAs(User::factory()->create());
    Storage::disk('local')->put('resident-ktp/test.jpg', 'fake image');
    $resident = Resident::factory()->create([
        'ktp_photo_path' => 'resident-ktp/test.jpg',
    ]);

    $this->get(route('residents.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('residents/index')
            ->where('residents.data.0.ktp_photo_url', route('residents.ktp-photo', $resident))
        );

    $this->get(route('residents.ktp-photo', $resident))->assertOk();
});
