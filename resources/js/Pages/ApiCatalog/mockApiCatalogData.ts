export type ApiCatalogProvider = {
    providerKey: string;
    domain: string;
};

export type ApiCatalogListItemSource = {
    title: string;
    apiKey: string;
    providerKey: string;
    serviceKey: string;
    domain: string;
    description: string;
    preferredVersion: string;
    openapiVersion: string;
    sourceLatestUpdatedAt: string;
};

export type ApiCatalogListItem = ApiCatalogListItemSource;

/*
 * API Discovery Hub 本体一覧・詳細の React 側モックデータです。
 * 本実装では Responder から apiCatalogItems / providers などを props で渡すため、
 * この固定配列は DB 接続前の UI 確認だけに使います。
 */
const mockApiCatalogItemSources: ApiCatalogListItemSource[] = [
    {
        title: 'Stripe API',
        apiKey: 'stripe.com',
        providerKey: 'stripe.com',
        serviceKey: 'payments',
        domain: 'payments',
        description:
            'Online payment processing APIs for cards, wallets, subscriptions, invoicing, checkout, and connected accounts.',
        preferredVersion: '2025-02-24',
        openapiVersion: '3.0.3',
        sourceLatestUpdatedAt: '2026-04-18',
    },
    {
        title: 'GitHub REST API',
        apiKey: 'github.com',
        providerKey: 'github.com',
        serviceKey: 'rest',
        domain: 'developer-tools',
        description:
            'Repository, issue, pull request, workflow, user, organization, and package operations for GitHub integrations.',
        preferredVersion: '2022-11-28',
        openapiVersion: '3.0.1',
        sourceLatestUpdatedAt: '2026-04-09',
    },
    {
        title: 'Google Calendar API',
        apiKey: 'googleapis.com:calendar',
        providerKey: 'googleapis.com',
        serviceKey: 'calendar:v3',
        domain: 'productivity',
        description:
            'Calendar events, availability, reminders, conference data, and calendar list management for Google Workspace.',
        preferredVersion: 'v3',
        openapiVersion: '3.0.0',
        sourceLatestUpdatedAt: '2026-03-30',
    },
    {
        title: 'Slack Web API',
        apiKey: 'slack.com:web',
        providerKey: 'slack.com',
        serviceKey: 'web-api',
        domain: 'communication',
        description:
            'Workspace messaging, channel management, user lookup, files, reactions, and app workflow endpoints for Slack.',
        preferredVersion: 'v1',
        openapiVersion: '3.0.0',
        sourceLatestUpdatedAt: '2026-04-22',
    },
    {
        title: 'Notion API',
        apiKey: 'notion.com',
        providerKey: 'notion.com',
        serviceKey: 'public-api',
        domain: 'productivity',
        description:
            'Database, page, block, comment, user, and search endpoints for building workspace automation around Notion.',
        preferredVersion: '2022-06-28',
        openapiVersion: '3.1.0',
        sourceLatestUpdatedAt: '2026-04-02',
    },
    {
        title: 'OpenAI API',
        apiKey: 'openai.com',
        providerKey: 'openai.com',
        serviceKey: 'platform',
        domain: 'ai',
        description:
            'Model inference, responses, embeddings, files, vector stores, realtime, and tool calling APIs for AI products.',
        preferredVersion: 'v1',
        openapiVersion: '3.1.0',
        sourceLatestUpdatedAt: '2026-04-26',
    },
    {
        title: 'Twilio Messaging API',
        apiKey: 'twilio.com:messaging',
        providerKey: 'twilio.com',
        serviceKey: 'messaging',
        domain: 'communication',
        description:
            'SMS, MMS, WhatsApp, sender, conversation, delivery status, and phone number messaging workflows.',
        preferredVersion: '2010-04-01',
        openapiVersion: '3.0.1',
        sourceLatestUpdatedAt: '2026-03-16',
    },
    {
        title: 'SendGrid v3 API',
        apiKey: 'sendgrid.com:v3',
        providerKey: 'sendgrid.com',
        serviceKey: 'mail',
        domain: 'communication',
        description:
            'Transactional email, dynamic templates, suppressions, sender authentication, and marketing contact APIs.',
        preferredVersion: 'v3',
        openapiVersion: '3.0.0',
        sourceLatestUpdatedAt: '2026-02-28',
    },
    {
        title: 'Shopify Admin API',
        apiKey: 'shopify.dev:admin',
        providerKey: 'shopify.dev',
        serviceKey: 'admin',
        domain: 'commerce',
        description:
            'Store admin resources for products, inventory, orders, fulfillments, customers, discounts, and app workflows.',
        preferredVersion: '2026-01',
        openapiVersion: '3.1.0',
        sourceLatestUpdatedAt: '2026-04-12',
    },
    {
        title: 'NASA Open APIs',
        apiKey: 'nasa.gov',
        providerKey: 'nasa.gov',
        serviceKey: 'open-data',
        domain: 'data',
        description:
            'Astronomy picture, Mars rover photos, imagery, patents, near earth objects, and public NASA data endpoints.',
        preferredVersion: 'v1',
        openapiVersion: '3.0.0',
        sourceLatestUpdatedAt: '2026-01-24',
    },
    {
        title: 'OpenWeather API',
        apiKey: 'openweathermap.org',
        providerKey: 'openweathermap.org',
        serviceKey: 'weather',
        domain: 'weather',
        description:
            'Current weather, forecasts, geocoding, historical weather, alerts, air pollution, and climate data services.',
        preferredVersion: '2.5',
        openapiVersion: '3.0.2',
        sourceLatestUpdatedAt: '2026-03-08',
    },
    {
        title: 'Spotify Web API',
        apiKey: 'spotify.com:web',
        providerKey: 'spotify.com',
        serviceKey: 'web-api',
        domain: 'media',
        description:
            'Catalog, album, artist, track, playlist, playback, user library, search, and recommendation endpoints.',
        preferredVersion: 'v1',
        openapiVersion: '3.0.0',
        sourceLatestUpdatedAt: '2026-04-06',
    },
    {
        title: 'Cloudflare API',
        apiKey: 'cloudflare.com',
        providerKey: 'cloudflare.com',
        serviceKey: 'global-api',
        domain: 'infrastructure',
        description:
            'DNS, zone, worker, firewall, cache, tunnel, access, account, analytics, and edge infrastructure APIs.',
        preferredVersion: 'v4',
        openapiVersion: '3.0.3',
        sourceLatestUpdatedAt: '2026-04-20',
    },
    {
        title: 'Auth0 Management API',
        apiKey: 'auth0.com:management',
        providerKey: 'auth0.com',
        serviceKey: 'management',
        domain: 'identity',
        description:
            'Tenant, user, organization, client, connection, role, permission, log, and identity provider management.',
        preferredVersion: 'v2',
        openapiVersion: '3.0.0',
        sourceLatestUpdatedAt: '2026-03-25',
    },
    {
        title: 'Microsoft Graph API',
        apiKey: 'microsoft.com:graph',
        providerKey: 'microsoft.com',
        serviceKey: 'graph',
        domain: 'productivity',
        description:
            'Unified Microsoft 365 data APIs for mail, calendar, files, users, groups, Teams, security, and identity.',
        preferredVersion: 'v1.0',
        openapiVersion: '3.0.1',
        sourceLatestUpdatedAt: '2026-04-15',
    },
];

export const mockApiCatalogItems: ApiCatalogListItem[] = mockApiCatalogItemSources;

export const mockProviders: ApiCatalogProvider[] = Array.from(
    /*
     * provider select は将来 providers prop として一覧本体から切り出す想定です。
     * モックでも items とは別の配列にして、Inertia 部分更新時の分割を意識します。
     */
    new Map(
        mockApiCatalogItems.map((item) => [
            item.providerKey,
            {
                providerKey: item.providerKey,
                domain: item.domain,
            },
        ]),
    ).values(),
).sort((first, second) => first.providerKey.localeCompare(second.providerKey));

export const mockDomains = Array.from(new Set(mockApiCatalogItems.map((item) => item.domain))).sort();
