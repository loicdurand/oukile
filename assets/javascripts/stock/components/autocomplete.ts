import { SEARCH_DEBOUNCE_MS } from '../config';
import type { FamilleArticle } from '../types';

export type FamilleSelectCallback = (famille: FamilleArticle) => void;

export function formatFamille(f: FamilleArticle): string {
    return [f.marque, f.modele, f.description].filter(Boolean).join(' · ');
}

/**
 * Autocomplete component for searching and selecting a FamilleArticle.
 * Supports keyboard navigation (arrows, Enter, Escape) and mouse selection.
 */
export class Autocomplete {
    private readonly input: HTMLInputElement;
    private readonly dropdown: HTMLUListElement;
    private readonly searchFn: (query: string) => Promise<FamilleArticle[]>;
    private readonly onSelect: FamilleSelectCallback;

    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private results: FamilleArticle[] = [];
    private activeIndex = -1;

    constructor(
        input: HTMLInputElement,
        dropdown: HTMLUListElement,
        searchFn: (query: string) => Promise<FamilleArticle[]>,
        onSelect: FamilleSelectCallback,
    ) {
        this.input = input;
        this.dropdown = dropdown;
        this.searchFn = searchFn;
        this.onSelect = onSelect;

        this.input.addEventListener('input', this.handleInput.bind(this));
        this.input.addEventListener('keydown', this.handleKeydown.bind(this));
        this.input.addEventListener('blur', this.handleBlur.bind(this));
    }

    // ── Event handlers ────────────────────────────────────────────────────────

    private handleInput(): void {
        const query = this.input.value.trim();
        if (this.debounceTimer) clearTimeout(this.debounceTimer);

        if (query.length < 2) {
            this.close();
            return;
        }

        this.debounceTimer = setTimeout(() => this.search(query), SEARCH_DEBOUNCE_MS);
    }

    private handleKeydown(e: KeyboardEvent): void {
        if (this.dropdown.hidden) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.setActive(Math.min(this.activeIndex + 1, this.results.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setActive(Math.max(this.activeIndex - 1, -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (this.activeIndex >= 0) this.pick(this.activeIndex);
                break;
            case 'Escape':
                this.close();
                break;
        }
    }

    private handleBlur(): void {
        // Delay to allow mousedown on dropdown items to fire first.
        setTimeout(() => this.close(), 150);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private async search(query: string): Promise<void> {
        this.results = await this.searchFn(query);
        this.activeIndex = -1;
        this.renderDropdown();
    }

    private renderDropdown(): void {
        this.dropdown.innerHTML = '';

        if (this.results.length === 0) {
            const li = document.createElement('li');
            li.className = 'qs__dropdown-empty';
            li.textContent = 'Aucun résultat.';
            this.dropdown.appendChild(li);
            this.dropdown.hidden = false;
            return;
        }

        this.results.forEach((f, i) => {
            const li = document.createElement('li');
            li.className = 'qs__dropdown-item';
            li.setAttribute('role', 'option');
            li.dataset.index = String(i);
            li.textContent = formatFamille(f);

            // mousedown (not click) to fire before blur
            li.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.pick(i);
            });

            this.dropdown.appendChild(li);
        });

        this.dropdown.hidden = false;
        this.input.setAttribute('aria-expanded', 'true');
    }

    private setActive(index: number): void {
        this.activeIndex = index;
        this.dropdown.querySelectorAll<HTMLLIElement>('.qs__dropdown-item').forEach((item, i) => {
            const active = i === index;
            item.classList.toggle('qs__dropdown-item--active', active);
            item.setAttribute('aria-selected', String(active));
        });
    }

    private pick(index: number): void {
        const famille = this.results[index];
        if (!famille) return;
        this.input.value = formatFamille(famille);
        this.close();
        this.onSelect(famille);
    }

    private close(): void {
        this.dropdown.hidden = true;
        this.input.setAttribute('aria-expanded', 'false');
        this.activeIndex = -1;
    }

    // ── Public ────────────────────────────────────────────────────────────────

    reset(): void {
        this.input.value = '';
        this.results = [];
        this.close();
    }

    focus(): void {
        this.input.focus();
    }
}
