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
            'per_page' => ['nullable', 'integer', 'between:1,20'],
            'deleted_ids' => ['nullable', 'array', 'max:20'],
            'deleted_ids.*' => ['string', 'regex:/^mock-project-\d{3}$/'],
            'overrides' => ['nullable', 'array', 'max:20'],
            'overrides.*' => [
                'array:id,company_name,contact_name,address,memo',
            ],
            'overrides.*.id' => [
                'required',
                'string',
                'regex:/^mock-project-\d{3}$/',
            ],
            'overrides.*.company_name' => ['required', 'string', 'max:100'],
            'overrides.*.contact_name' => ['required', 'string', 'max:100'],
            'overrides.*.address' => ['required', 'string', 'max:200'],
            'overrides.*.memo' => ['required', 'string', 'max:1000'],
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

    public function perPage(): ?int
    {
        $perPage = $this->validated('per_page');

        return $perPage === null ? null : (int) $perPage;
    }

    /**
     * @return array<int, string>
     */
    public function deletedProjectIds(): array
    {
        $deletedIds = $this->validated('deleted_ids', []);

        if (! is_array($deletedIds)) {
            return [];
        }

        return array_values(array_unique(array_filter(
            $deletedIds,
            fn (mixed $deletedId): bool => is_string($deletedId),
        )));
    }

    /**
     * @return array<int, array{id: string, companyName: string, contactName: string, address: string, memo: string}>
     */
    public function projectOverrides(): array
    {
        $overrides = $this->validated('overrides', []);

        if (! is_array($overrides)) {
            return [];
        }

        $normalizedOverrides = [];

        foreach ($overrides as $override) {
            if (
                ! is_array($override) ||
                ! is_string($override['id'] ?? null) ||
                ! is_string($override['company_name'] ?? null) ||
                ! is_string($override['contact_name'] ?? null) ||
                ! is_string($override['address'] ?? null) ||
                ! is_string($override['memo'] ?? null)
            ) {
                continue;
            }

            $normalizedOverrides[$override['id']] = [
                'id' => $override['id'],
                'companyName' => $override['company_name'],
                'contactName' => $override['contact_name'],
                'address' => $override['address'],
                'memo' => $override['memo'],
            ];
        }

        return array_values($normalizedOverrides);
    }
}
