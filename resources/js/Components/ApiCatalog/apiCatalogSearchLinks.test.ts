/**
 * API Catalog の外部検索リンク生成 utility が provider / service / title を安全なURLへ変換する仕様を固定します。
 */
import { describe, expect, it } from 'vitest';

import {
    buildApiCatalogSearchLinks,
    buildApiCatalogSearchUrl,
    type ApiCatalogSearchLinkKey,
} from './apiCatalogSearchLinks';

/*
 * SearchButtons.tsx はReact表示責務を持つため、今回のテスト対象から外します。
 * ここではDOMやブラウザAPIに依存しない URL 生成ユーティリティだけを固定し、
 * まず Vitest の導入範囲を小さく保ちます。
 */
describe('apiCatalogSearchLinks', () => {
    it('builds a Google search URL from title and provider key', () => {
        /*
         * API Catalog の検索リンクは、title と providerKey を基本クエリにします。
         * 入力値には前後空白や連続空白が入り得るため、検索意図を変えずに
         * 空白だけ正規化されることを確認します。
         */
        const href = buildApiCatalogSearchUrl({
            title: ' GitHub   REST API ',
            providerKey: ' github.com ',
        });

        expect(href).toBe(
            'https://www.google.com/search?q=GitHub%20REST%20API%20github.com',
        );
    });

    it('appends normalized suffix text to the base search query', () => {
        /*
         * Docs / Sample / GitHub のような補助リンクは、基本クエリに suffix を足して作ります。
         * suffix 側の空白も正規化しないと、同じ検索意図でもURLが揺れてスナップショットや
         * リンク比較が不安定になるため、ここで固定します。
         */
        const href = buildApiCatalogSearchUrl(
            {
                title: 'Stripe API',
                providerKey: 'stripe.com',
            },
            ' official   docs ',
        );

        expect(href).toBe(
            'https://www.google.com/search?q=Stripe%20API%20stripe.com%20official%20docs',
        );
    });

    it('falls back to description and api key when title and provider key are blank', () => {
        /*
         * API名やproviderが欠けているデータでも検索導線を空にしないため、
         * description と apiKey を保険として使います。このfallbackは表示側の利便性であり、
         * RepositoryやModelに寄せない境界としてユーティリティ側で守ります。
         */
        const href = buildApiCatalogSearchUrl({
            title: '   ',
            providerKey: null,
            description: ' Payment   platform ',
            apiKey: 'stripe.com',
        });

        expect(href).toBe(
            'https://www.google.com/search?q=Payment%20platform%20stripe.com',
        );
    });

    it('falls back to a generic API query when all target fields are empty', () => {
        /*
         * 全フィールドが空でも href は必ず有効なGoogle検索URLにします。
         * SearchButtons.tsx 側で null 分岐を増やさずに済むよう、ユーティリティの戻り値を
         * 常にリンクとして扱える形にしています。
         */
        const href = buildApiCatalogSearchUrl({
            title: null,
            providerKey: null,
            description: '   ',
            apiKey: '',
        });

        expect(href).toBe('https://www.google.com/search?q=API');
    });

    it('encodes non ASCII text and reserved query characters safely', () => {
        /*
         * カタログには日本語名や slash を含む語句が入ります。
         * ここでは encodeURIComponent によって、文字化けや query 破損を起こさない
         * URLになることだけを確認し、実際の外部検索通信は行いません。
         */
        const href = buildApiCatalogSearchUrl(
            {
                title: '気象庁 XML',
                providerKey: 'data.go.jp',
            },
            'example/sample',
        );

        expect(href).toBe(
            'https://www.google.com/search?q=%E6%B0%97%E8%B1%A1%E5%BA%81%20XML%20data.go.jp%20example%2Fsample',
        );
    });

    it('builds the four expected search helper links', () => {
        /*
         * UIが表示する4種類のリンク定義を固定します。
         * helperLabel や ariaLabel は表示・アクセシビリティ用の文言ですが、
         * ここではReactを描画せず、ユーティリティが返すデータ形だけを検証します。
         */
        const links = buildApiCatalogSearchLinks({
            title: 'GitHub REST API',
            providerKey: 'github.com',
        });

        /*
         * satisfies で key の列挙が ApiCatalogSearchLinkKey に収まることも型レベルで確認します。
         * テスト実行時の期待値とTypeScript上の許可値がズレにくくなるためです。
         */
        expect(links.map((link) => link.key)).toEqual([
            'google',
            'github',
            'docs',
            'sample',
        ] satisfies ApiCatalogSearchLinkKey[]);

        expect(links).toMatchObject([
            {
                key: 'google',
                label: 'Google',
                ariaLabel: 'Googleで関連情報を検索する',
                href: 'https://www.google.com/search?q=GitHub%20REST%20API%20github.com',
            },
            {
                key: 'github',
                label: 'GitHub',
                ariaLabel: 'GitHub上の関連情報をGoogleで検索する',
                href: 'https://www.google.com/search?q=GitHub%20REST%20API%20github.com%20site%3Agithub.com',
            },
            {
                key: 'docs',
                label: 'Docs',
                helperLabel: '候補',
                ariaLabel:
                    '公式とは断定せず、関連ドキュメント候補をGoogleで検索する',
                href: 'https://www.google.com/search?q=GitHub%20REST%20API%20github.com%20official%20docs',
            },
            {
                key: 'sample',
                label: 'Sample',
                helperLabel: '候補',
                ariaLabel:
                    '正しいサンプルとは断定せず、実装例候補をGoogleで検索する',
                href: 'https://www.google.com/search?q=GitHub%20REST%20API%20github.com%20example%20sample',
            },
        ]);
    });
});
