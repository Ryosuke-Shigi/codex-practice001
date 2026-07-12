<?php

namespace App\Http\Requests\LumiLabo;

use Illuminate\Foundation\Http\FormRequest;

/**
 * LumiLabo 案件一覧 MOCK の query parameter を検証します。
 *
 * 検索、並び替え、ページ分割の判断は Query Action に残します。
 */
class LumiLaboProjectMockIndexRequest extends FormRequest
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
        return [
            'keyword' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', 'string', 'in:registered_desc,registered_asc'],
            'page' => ['nullable', 'integer', 'min:1'],
            'viewport' => ['nullable', 'string', 'in:mobile,tablet,desktop'],
        ];
    }

    public function keyword(): ?string
    {
        $keyword = $this->validated('keyword');

        if (! is_string($keyword)) {
            return null;
        }

        $trimmedKeyword = preg_replace('/^[\s　]+|[\s　]+$/u', '', $keyword);

        return $trimmedKeyword === '' ? null : $trimmedKeyword;
    }

    public function sort(): string
    {
        $sort = $this->validated('sort');

        return is_string($sort) ? $sort : 'registered_desc';
    }

    public function page(): int
    {
        $page = $this->validated('page');

        return $page === null ? 1 : (int) $page;
    }

    public function viewport(): string
    {
        $viewport = $this->validated('viewport');

        return is_string($viewport) ? $viewport : 'mobile';
    }
}
