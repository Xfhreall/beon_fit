<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            DB::statement("UPDATE payments SET paid_at = date(paid_at) || ' ' || time(created_at) WHERE time(paid_at) = '00:00:00' AND created_at IS NOT NULL");
            DB::statement("UPDATE expenses SET spent_at = date(spent_at) || ' ' || time(created_at) WHERE time(spent_at) = '00:00:00' AND created_at IS NOT NULL");

            return;
        }

        DB::statement("UPDATE payments SET paid_at = TIMESTAMP(DATE(paid_at), TIME(created_at)) WHERE TIME(paid_at) = '00:00:00' AND created_at IS NOT NULL");
        DB::statement("UPDATE expenses SET spent_at = TIMESTAMP(DATE(spent_at), TIME(created_at)) WHERE TIME(spent_at) = '00:00:00' AND created_at IS NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Intentionally not reversible: the original missing time component was already lost.
    }
};
