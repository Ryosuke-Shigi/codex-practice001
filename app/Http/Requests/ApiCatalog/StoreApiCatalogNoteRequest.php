<?php

namespace App\Http\Requests\ApiCatalog;

use Illuminate\Foundation\Http\FormRequest;

class StoreApiCatalogNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        /*
         * Request は入力形式だけを検証します。
         * body の空文字は required で保存前に落とし、所属APIの判定は Action/Repository に任せます。
         */
        return [
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string'],
        ];
    }
}
