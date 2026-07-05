<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    protected function perPage(Request $request, string $parameter = 'per_page'): int
    {
        $perPage = (int) $request->integer($parameter, 10);

        return in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 10;
    }
}
