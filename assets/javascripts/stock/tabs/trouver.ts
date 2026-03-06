import { searchFamilles, getLotsForFamille } from '../api';
import { resolveLocation } from '../store';
import { Autocomplete } from '../components/autocomplete';
import type { FamilleArticle, Lot } from '../types';

// ── Location card rendering ────────────────────────────────────────────────

function renderCard(famille: FamilleArticle, lots: Lot[]): HTMLElement {
    const card = document.createElement('div');
    card.className = 'qs__result-card';

    // Header
    const header = document.createElement('div');
    header.className = 'qs__result-header';

    const title = document.createElement('span');
    title.className = 'qs__result-title';
    title.textContent = [famille.marque, famille.modele].filter(Boolean).join(' ') || famille.description || '(sans nom)';

    header.appendChild(title);

    if (famille.description && (famille.marque || famille.modele)) {
        const subtitle = document.createElement('span');
        subtitle.className = 'qs__result-subtitle';
        subtitle.textContent = famille.description;
        header.appendChild(subtitle);
    }

    if (famille.categorie?.nom) {
        const badge = document.createElement('span');
        badge.className = 'qs__result-categorie';
        badge.textContent = famille.categorie.nom;
        header.appendChild(badge);
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

// ── Init ──────────────────────────────────────────────────────────────────

export function initTrouver(): () => void {
    const input    = document.getElementById('trouver-query')    as HTMLInputElement;
    const dropdown = document.getElementById('trouver-dropdown') as HTMLUListElement;
    const results  = document.getElementById('trouver-results')  as HTMLElement;
    const loading  = document.getElementById('trouver-loading')  as HTMLElement;

    async function onFamilleSelected(famille: FamilleArticle): Promise<void> {
        loading.hidden = false;
        results.innerHTML = '';

        try {
            const lots = await getLotsForFamille(famille.id);
            results.appendChild(renderCard(famille, lots));
        } catch (err) {
            const msg = document.createElement('p');
            msg.className = 'qs__error';
            msg.textContent = 'Erreur lors de la recherche. Veuillez réessayer.';
            results.appendChild(msg);
            console.error('[Trouver]', err);
        } finally {
            loading.hidden = true;
        }
    }

    const autocomplete = new Autocomplete(input, dropdown, searchFamilles, onFamilleSelected);

    return () => autocomplete.focus();
}
