import { searchFamilles, getLotsForFamille } from '../api';
import { resolveLocation } from '../store';
import { SEARCH_DEBOUNCE_MS } from '../config';
import type { FamilleArticle, Lot } from '../types';

// ── Rendering ─────────────────────────────────────────────────────────────

function familleTitle(f: FamilleArticle): string {
    return [f.marque, f.modele].filter(Boolean).join(' ') || f.description || '(sans nom)';
}

function renderCard(famille: FamilleArticle, lots: Lot[]): HTMLElement {
    const card = document.createElement('div');
    card.className = 'qs__result-card';

    // Header
    const header = document.createElement('div');
    header.className = 'qs__result-header';

    const title = document.createElement('span');
    title.className = 'qs__result-title';
    title.textContent = familleTitle(famille);

    const subtitle = document.createElement('span');
    subtitle.className = 'qs__result-subtitle';
    subtitle.textContent = famille.description ?? '';

    const categorieBadge = document.createElement('span');
    categorieBadge.className = 'qs__result-categorie';
    categorieBadge.textContent = famille.categorie?.nom ?? '';

    header.appendChild(title);
    if (famille.description && (famille.marque || famille.modele)) {
        header.appendChild(subtitle);
    }
    if (famille.categorie?.nom) {
        header.appendChild(categorieBadge);
    }
    card.appendChild(header);

    // Locations
    const activeLots = lots.filter((l) => l.nombre > 0);

    if (activeLots.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'qs__location-empty';
        empty.textContent = 'Aucun stock disponible dans cette unité.';
        card.appendChild(empty);
        return card;
    }

    const list = document.createElement('ul');
    list.className = 'qs__location-list';

    for (const lot of activeLots) {
        const path = resolveLocation(lot.emplacement);
        if (!path) continue;

        const li = document.createElement('li');
        li.className = 'qs__location-item';

        const pathEl = document.createElement('span');
        pathEl.className = 'qs__location-path';
        pathEl.textContent = `${path.piece.nom} › ${path.zone.nom} › ${path.rangement.nom} › ${path.emplacement.nom}`;

        const qty = document.createElement('span');
        qty.className = 'qs__location-qty';
        qty.textContent = `×${lot.nombre}`;

        li.appendChild(pathEl);
        li.appendChild(qty);
        list.appendChild(li);
    }

    if (list.children.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'qs__location-empty';
        empty.textContent = 'Stock épuisé dans cette unité.';
        card.appendChild(empty);
    } else {
        card.appendChild(list);
    }

    return card;
}

function renderResults(container: HTMLElement, familles: FamilleArticle[], lotsMap: Map<number, Lot[]>): void {
    container.innerHTML = '';

    if (familles.length === 0) {
        const msg = document.createElement('p');
        msg.className = 'qs__no-results';
        msg.textContent = 'Aucun article trouvé pour cette recherche.';
        container.appendChild(msg);
        return;
    }

    familles.forEach((f) => {
        const lots = lotsMap.get(f.id) ?? [];
        container.appendChild(renderCard(f, lots));
    });
}

// ── Init ──────────────────────────────────────────────────────────────────

export function initTrouver(): () => void {
    const input = document.getElementById('trouver-query') as HTMLInputElement;
    const results = document.getElementById('trouver-results') as HTMLElement;
    const loading = document.getElementById('trouver-loading') as HTMLElement;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    async function doSearch(query: string): Promise<void> {
        loading.hidden = false;
        results.innerHTML = '';

        try {
            const familles = await searchFamilles(query);

            const lotsMap = new Map<number, Lot[]>();
            await Promise.all(
                familles.map(async (f) => {
                    const lots = await getLotsForFamille(f.id);
                    lotsMap.set(f.id, lots);
                }),
            );

            renderResults(results, familles, lotsMap);
        } catch (err) {
            const msg = document.createElement('p');
            msg.className = 'qs__error';
            msg.textContent = 'Erreur lors de la recherche. Veuillez réessayer.';
            results.innerHTML = '';
            results.appendChild(msg);
            console.error('[Trouver]', err);
        } finally {
            loading.hidden = true;
        }
    }

    input.addEventListener('input', () => {
        const query = input.value.trim();
        if (debounceTimer) clearTimeout(debounceTimer);

        if (query.length < 2) {
            results.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(() => doSearch(query), SEARCH_DEBOUNCE_MS);
    });

    return () => input.focus();
}
