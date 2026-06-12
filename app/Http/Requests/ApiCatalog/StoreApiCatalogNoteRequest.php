<?php

namespace App\Http\Requests\ApiCatalog;

use Illuminate\Foundation\Http\FormRequest;

/**
 * APIカタログ保存メモ作成の入力形式を検証する Request です。
 *
 * title / body の型と必須だけを確認し、対象APIへ保存できるかの判定は Action / Repository に委譲します。
 */
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
