<?php

namespace App\Http\Requests\DanceShortsAnalyzer;

use Illuminate\Foundation\Http\FormRequest;

class DanceShortsAnalyzerSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * PRODUCT 検索で受け取る query parameter の形式だけを検証します。
     *
     * keyword 未入力時に DB 検索しない判断、per_page を 20 件に固定する判断、
     * sort を実際の orderBy に写像する判断は、Request ではなく後段の DTO /
     * Action / Repository に分けます。
     *
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        /*
         * Request は query parameter の形式だけを検証します。
         * keyword 未入力時に検索しない判断は Query Action 側へ残します。
         */
        return [
            'keyword' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'sort' => ['nullable', 'string', 'in:published_desc,published_asc'],
        ];
    }

    public function keyword(): ?string
    {
        $keyword = $this->validated('keyword');

        if (! is_string($keyword)) {
            return null;
        }

        $trimmedKeyword = trim($keyword);

        return $trimmedKeyword === '' ? null : $trimmedKeyword;
    }

    /**
     * page は未指定なら 1 ページ目として扱います。
     *
     * min:1 は rules で担保しているため、ここでは Controller が InputDTO へ
     * 渡せる整数へそろえるだけにします。
     */
    public function page(): int
    {
        $page = $this->validated('page');

        return $page === null ? 1 : (int) $page;
    }

    /**
     * sort は未指定なら登録日の降順にします。
     *
     * 許可済み文字列の検証だけを Request で行い、並び替えの SQL は
     * Repository に閉じ込めます。
     */
    public function sort(): string
    {
        $sort = $this->validated('sort');

        return is_string($sort) ? $sort : 'published_desc';
    }
}
