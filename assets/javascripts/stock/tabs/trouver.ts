import { searchFamilles, getLotsForFamille } from "../api";
import { Autocomplete } from "../components/autocomplete";
import { renderLotList } from "../components/lot-list";
import type { FamilleArticle, Lot } from "../types";

// ── Location card rendering ────────────────────────────────────────────────

function renderCard(
    famille: FamilleArticle,
    lots: Lot[],
    onMutated: () => void,
): HTMLElement {
    const card = document.createElement("div");
    card.className = "qs__result-card";

    // ── Header ────────────────────────────────────────────────────────────

    const header = document.createElement("div");
    header.className = "qs__result-header";

    const title = document.createElement("span");
    title.className = "qs__result-title";
    title.textContent =
        [famille.marque, famille.modele].filter(Boolean).join(" ") ||
        famille.description ||
        "(sans nom)";
    header.appendChild(title);

    if (famille.description && (famille.marque || famille.modele)) {
        const subtitle = document.createElement("span");
        subtitle.className = "qs__result-subtitle";
        subtitle.textContent = famille.description;
        header.appendChild(subtitle);
    }

    if (famille.categorie?.nom) {
        const badge = document.createElement("span");
        badge.className = "qs__result-categorie";
        badge.textContent = famille.categorie.nom;
        header.appendChild(badge);
    }

    card.appendChild(header);

    // ── Lots ──────────────────────────────────────────────────────────────

    card.appendChild(renderLotList(famille, lots, onMutated));

    return card;
}

// ── Init ──────────────────────────────────────────────────────────────────

export function initTrouver(): { focus: () => void; reset: () => void } {
    const input = document.getElementById("trouver-query") as HTMLInputElement;
    const dropdown = document.getElementById(
        "trouver-dropdown",
    ) as HTMLUListElement;
    const results = document.getElementById("trouver-results") as HTMLElement;
    const loading = document.getElementById("trouver-loading") as HTMLElement;

    async function loadAndRender(famille: FamilleArticle): Promise<void> {
        loading.hidden = false;
        results.innerHTML = "";

        try {
            const lots = await getLotsForFamille(famille.id);
            results.appendChild(
                renderCard(famille, lots, () => loadAndRender(famille)),
            );
        } catch (err) {
            const msg = document.createElement("p");
            msg.className = "qs__error";
            msg.textContent =
                "Erreur lors de la recherche. Veuillez réessayer.";
            results.appendChild(msg);
            console.error("[Trouver]", err);
        } finally {
            loading.hidden = true;
        }
    }

    const autocomplete = new Autocomplete(
        input,
        dropdown,
        searchFamilles,
        loadAndRender,
    );

    function reset(): void {
        autocomplete.reset();
        results.innerHTML = "";
        loading.hidden = true;
    }

    return { focus: () => autocomplete.focus(), reset };
}
