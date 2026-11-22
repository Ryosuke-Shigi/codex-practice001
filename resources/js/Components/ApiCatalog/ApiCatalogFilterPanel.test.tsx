// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ApiCatalogFilterPanel from './ApiCatalogFilterPanel';

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false }) });
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

it('keeps keyword visible when additional filters are closed and filters provider candidates without applying a search', async () => {
    const change = vi.fn();
    await act(async () => root.render(<ApiCatalogFilterPanel keyword="webhooks" providerKey="" domain="" sortKey="name_asc"
        providerOptions={[{ value: 'adyen.com', label: 'adyen.com' }, { value: 'example.org', label: 'example.org' }]}
        domainOptions={[]} hasActiveFilters onKeywordChange={vi.fn()} onProviderKeyChange={change}
        onDomainChange={vi.fn()} onSortKeyChange={vi.fn()} onClear={vi.fn()} />));
    const keyword = host.querySelector('input[type="search"]')!;
    expect(keyword.closest('[hidden]')).toBeNull();
    expect(host.querySelector('select[aria-label=\"Provider\"]')!.closest('[hidden]')).not.toBeNull();
    const toggle = host.querySelector<HTMLButtonElement>('[aria-expanded]')!;
    await act(async () => toggle.click());
    const candidateInput = host.querySelector<HTMLInputElement>('[aria-label="Provider候補を絞る"]')!;
    expect(candidateInput).not.toBeNull();
    await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(candidateInput, 'adyen');
        candidateInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(change).not.toHaveBeenCalled();
    const select = host.querySelector<HTMLSelectElement>('select[aria-label="Provider"]')!;
    expect(Array.from(select.options).map(option => option.value)).toEqual(['', 'adyen.com']);
    await act(async () => { select.value = 'adyen.com'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(change).toHaveBeenCalledExactlyOnceWith('adyen.com');
});
