<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Foundation\Http\Middleware\TrimStrings;
use Illuminate\Http\Request;

/**
 * LumiLabo 案件一覧 MOCK の会社名だけを trim 対象から外します。
 *
 * Laravel 標準の TrimStrings は属性名の完全一致だけを除外できるため、
 * 動的な override index を含む company_name をここで限定的に扱います。
 */
class PreserveLumiLaboProjectMockCompanyNameWhitespace extends TrimStrings
{
    private bool $preservesCompanyNameWhitespace = false;

    public function handle($request, Closure $next)
    {
        $this->preservesCompanyNameWhitespace =
            $request instanceof Request &&
            $request->is('lab/lumilabo-project-mock');

        return parent::handle($request, $next);
    }

    protected function transform($key, $value)
    {
        if (
            $this->preservesCompanyNameWhitespace &&
            is_string($key) &&
            preg_match('/^overrides\.\d+\.company_name$/', $key) === 1
        ) {
            return $value;
        }

        return parent::transform($key, $value);
    }
}
