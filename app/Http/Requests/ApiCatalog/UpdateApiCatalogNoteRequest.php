<?php

namespace App\Http\Requests\ApiCatalog;

use Illuminate\Foundation\Http\FormRequest;

class UpdateApiCatalogNoteRequest extends FormRequest
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
         * 更新でも作成と同じ入力形式にします。
         * note が対象APIに属するかどうかは、IDだけを見てここでは判断しません。
         */
        return [
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string'],
        ];
    }
}
