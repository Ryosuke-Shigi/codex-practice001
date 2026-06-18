<?php

namespace App\Http\Requests\ApplicationLog;

use App\DTO\ApplicationLog\ApplicationLogIndexInputDTO;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * logs 表示の query parameter を検証する Request です。
 */
final class ApplicationLogIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'tab' => ['nullable', 'string', Rule::in(ApplicationLogIndexInputDTO::ALLOWED_TABS)],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    public function toInputDTO(): ApplicationLogIndexInputDTO
    {
        $tab = $this->validated('tab');
        $limit = $this->validated('limit');

        return new ApplicationLogIndexInputDTO(
            activeTab: is_string($tab) ? $tab : ApplicationLogIndexInputDTO::DEFAULT_TAB,
            limit: $limit === null ? ApplicationLogIndexInputDTO::DEFAULT_LIMIT : (int) $limit,
        );
    }
}
