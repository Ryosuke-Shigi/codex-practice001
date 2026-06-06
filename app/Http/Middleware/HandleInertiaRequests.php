<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * 初回訪問時に読み込む Inertia の root template です。
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * 現在の asset version を Inertia に渡します。
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * 全ページで共有する Inertia props を定義します。
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
        ];
    }
}
