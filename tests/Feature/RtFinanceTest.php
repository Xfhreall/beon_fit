<?php

use App\Models\Bill;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\FeeType;
use App\Models\House;
use App\Models\Payment;
use App\Models\Resident;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\FinanceSeeder;
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

test('payment table receives database payment time', function () {
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

    $this->post(route('payments.store'), [
        'house_id' => $house->id,
        'resident_id' => $resident->id,
        'fee_type_id' => $fee->id,
        'paid_at' => '2026-07-03T14:25',
        'period_month' => 7,
        'period_year' => 2026,
        'months_paid' => 1,
        'amount' => 100000,
    ])->assertRedirect(route('payments.index', ['month' => 7, 'year' => 2026]));

    expect(Payment::first()->getRawOriginal('paid_at'))->toBe('2026-07-03 14:25:00');

    $this->get(route('payments.index', ['month' => 7, 'year' => 2026]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('payments.data.0.paid_at', '2026-07-03 14:25:00')
        );
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

test('expense table receives database expense time', function () {
    $this->actingAs(User::factory()->create());

    $category = ExpenseCategory::factory()->create();

    $this->post(route('expenses.store'), [
        'expense_category_id' => $category->id,
        'spent_at' => '2026-07-03T09:15',
        'amount' => 250000,
        'description' => 'Perbaikan selokan',
        'is_routine' => false,
    ])->assertRedirect(route('expenses.index', ['month' => 7, 'year' => 2026]));

    expect(Expense::first()->getRawOriginal('spent_at'))->toBe('2026-07-03 09:15:00');

    $this->get(route('expenses.index', ['month' => 7, 'year' => 2026]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('expenses.data.0.spent_at', '2026-07-03 09:15:00')
        );
});

test('finance seeder stores expense times', function () {
    try {
        CarbonImmutable::setTestNow('2026-07-05 08:45:30');
        $this->seed(FinanceSeeder::class);

        expect(Expense::pluck('spent_at')->map->format('H:i:s')->all())
            ->each->toBe('08:45:30');
    } finally {
        CarbonImmutable::setTestNow();
    }
});

test('paginated tables accept allowed page sizes', function () {
    $this->actingAs(User::factory()->create());
    Resident::factory()->count(15)->create();

    $this->get(route('residents.index', ['per_page' => 10]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('residents.per_page', 10)
            ->count('residents.data', 10)
            ->where('filters.per_page', '10')
        );
});

test('report detail tables are paginated independently', function () {
    $this->actingAs(User::factory()->create());
    Payment::factory()->count(12)->create([
        'period_month' => 7,
        'period_year' => 2026,
    ]);
    Expense::factory()->count(12)->create([
        'spent_at' => '2026-07-05 10:00:00',
    ]);

    $this->get(route('reports.index', [
        'month' => 7,
        'year' => 2026,
        'income_per_page' => 10,
        'expense_per_page' => 10,
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('incomeDetails.per_page', 10)
            ->count('incomeDetails.data', 10)
            ->where('expenseDetails.per_page', 10)
            ->count('expenseDetails.data', 10)
        );
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
