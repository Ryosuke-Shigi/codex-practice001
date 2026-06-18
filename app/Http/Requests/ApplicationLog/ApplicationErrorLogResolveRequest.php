<?php

namespace App\Http\Requests\ApplicationLog;

use Illuminate\Foundation\Http\FormRequest;

/**
 * ERROR ログ対応済み操作の入口 Request です。
 */
final class ApplicationErrorLogResolveRequest extends FormRequest
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
        return [];
    }
}
