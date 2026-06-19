<?php

namespace App\Http\Requests\ApplicationLog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * ERROR ログ対応済み操作の入口 Request です。
 *
 * confirmation は公開ポートフォリオ上の誤操作防止だけを目的とし、認証や認可としては扱いません。
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
        return [
            'confirmation' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * confirmation keyword は config 固定値と比較し、Action へは渡しません。
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->has('confirmation')) {
                return;
            }

            $expected = (string) config('application_logs.resolve_confirmation_keyword');
            $confirmation = (string) $this->input('confirmation');

            if ($expected === '' || ! hash_equals($expected, $confirmation)) {
                $validator->errors()->add('confirmation', '確認入力が一致しません。');
            }
        });
    }
}
