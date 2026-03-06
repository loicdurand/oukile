import { initStore } from './store';
import { initTrouver } from './tabs/trouver';
import { initRanger } from './tabs/ranger';
import { initSortir } from './tabs/sortir';

type TabId = 'trouver' | 'ranger' | 'sortir';

const TAB_ORDER: TabId[] = ['trouver', 'ranger', 'sortir'];

let activeTab: TabId = 'trouver';
const focusFns = new Map<TabId, () => void>();

// ── Helpers ───────────────────────────────────────────────────────────────

function isInputFocused(): boolean {
    const el = document.activeElement;
    return (
        el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement
    );
}

// ── Tab management ────────────────────────────────────────────────────────

function activateTab(id: TabId): void {
    TAB_ORDER.forEach((tabId) => {
        const btn   = document.getElementById(`tab-${tabId}`)   as HTMLButtonElement;
        const panel = document.getElementById(`panel-${tabId}`) as HTMLElement;
        const isActive = tabId === id;

        btn.classList.toggle('qs__tab--active', isActive);
        btn.setAttribute('aria-selected', String(isActive));
        panel.hidden = !isActive;
    });

    activeTab = id;
    focusFns.get(id)?.();
}

function cycleTab(): void {
    const next = (TAB_ORDER.indexOf(activeTab) + 1) % TAB_ORDER.length;
    activateTab(TAB_ORDER[next]);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────

export async function initApp(): Promise<void> {
    const appEl = document.getElementById('qs-app') as HTMLElement;

    // Show loading state while the location store is fetched.
    appEl.dataset.loading = 'true';
    try {
        await initStore();
    } catch (err) {
        console.error('[QuickStock] Failed to preload location data:', err);
    } finally {
        delete appEl.dataset.loading;
    }

    // Init tab logic — each returns a focus function.
    focusFns.set('trouver', initTrouver());
    focusFns.set('ranger',  initRanger());
    focusFns.set('sortir',  initSortir());

    // Wire up tab buttons.
    TAB_ORDER.forEach((id) => {
        const btn = document.getElementById(`tab-${id}`) as HTMLButtonElement;
        btn.addEventListener('click', () => activateTab(id));
    });

    // Global keyboard shortcuts (only when no form field is focused).
    document.addEventListener('keydown', (e) => {
        if (isInputFocused()) return;

        if (e.key === 'Tab') {
            e.preventDefault();
            cycleTab();
            return;
        }

        if (e.key === '1') activateTab('trouver');
        if (e.key === '2') activateTab('ranger');
        if (e.key === '3') activateTab('sortir');
    });

    // Focus the first tab.
    activateTab('trouver');
}
