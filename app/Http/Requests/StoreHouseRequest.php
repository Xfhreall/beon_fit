<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreHouseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'number' => ['required', 'string', 'max:50', Rule::unique('houses', 'number')],
            'block' => ['nullable', 'string', 'max:50'],
            'status' => ['required', Rule::in(['dihuni', 'tidak_dihuni'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
