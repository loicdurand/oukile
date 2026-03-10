import {
    searchFamilles,
    findLot,
    createLot,
    patchLot,
    getLotsForFamille,
} from "../api";
import { Autocomplete } from "../components/autocomplete";
import {
    LocationSelects,
    LocationSelection,
} from "../components/location-selects";
import { renderLotList, shortLabel } from "../components/lot-list";
import type { FamilleArticle } from "../types";

export type MouvementMode = "ranger" | "sortir";

// ── Feedback ──────────────────────────────────────────────────────────────

function showFeedback(el: HTMLElement, message: string, isError = false): void {
    el.textContent = message;
    el.className = `qs__feedback ${isError ? "qs__feedback--error" : "qs__feedback--success"}`;
    el.hidden = false;
    setTimeout(() => {
        el.hidden = true;
    }, 3500);
}

// ── Factory ───────────────────────────────────────────────────────────────

/**
 * Initialises a Ranger or Sortir tab.
 * Returns { focus, reset } for the tab manager.
 */
export function createMouvementTab(mode: MouvementMode): {
    focus: () => void;
    reset: () => void;
} {
    const p = mode; // element id prefix

    const queryInput = document.getElementById(
        `${p}-query`,
    ) as HTMLInputElement;
    const dropdown = document.getElementById(
        `${p}-dropdown`,
    ) as HTMLUListElement;
    const stepSearch = document.getElementById(
        `${p}-step-search`,
    ) as HTMLElement;
    const stepLocation = document.getElementById(
        `${p}-step-location`,
    ) as HTMLElement;
    const familleLabel = document.getElementById(
        `${p}-famille-label`,
    ) as HTMLElement;
    const resetBtn = document.getElementById(`${p}-reset`) as HTMLButtonElement;
    const pieceSelect = document.getElementById(
        `${p}-piece`,
    ) as HTMLSelectElement;
    const zoneSelect = document.getElementById(
        `${p}-zone`,
    ) as HTMLSelectElement;
    const rangementSelect = document.getElementById(
        `${p}-rangement`,
    ) as HTMLSelectElement;
    const emplacementSelect = document.getElementById(
        `${p}-emplacement`,
    ) as HTMLSelectElement;
    const quantiteInput = document.getElementById(
        `${p}-quantite`,
    ) as HTMLInputElement;
    const confirmBtn = document.getElementById(
        `${p}-confirm`,
    ) as HTMLButtonElement;
    const feedbackEl = document.getElementById(`${p}-feedback`) as HTMLElement;
    const similarPanel = document.getElementById(`${p}-similar`) as HTMLElement;
    const similarList = document.getElementById(
        `${p}-similar-list`,
    ) as HTMLElement;
    const similarLoading = document.getElementById(
        `${p}-similar-loading`,
    ) as HTMLElement;

    let selectedFamille: FamilleArticle | null = null;
    let selectedLocation: LocationSelection = {
        piece: null,
        zone: null,
        rangement: null,
        emplacement: null,
    };
    let isLoading = false;

    // ── Sub-components ────────────────────────────────────────────────────

    const locationSelects = new LocationSelects(
        pieceSelect,
        zoneSelect,
        rangementSelect,
        emplacementSelect,
        (selection) => {
            selectedLocation = selection;
            syncConfirmBtn();
        },
    );

    const autocomplete = new Autocomplete(
        queryInput,
        dropdown,
        searchFamilles,
        (famille) => {
            selectedFamille = famille;
            familleLabel.textContent = shortLabel(famille);
            stepSearch.hidden = true;
            stepLocation.hidden = false;
            pieceSelect.focus();
            loadSimilar(famille);
        },
    );

    // ── State sync ────────────────────────────────────────────────────────

    function syncConfirmBtn(): void {
        confirmBtn.disabled =
            !selectedFamille || !selectedLocation.emplacement || isLoading;
    }

    // ── Similar stock panel ───────────────────────────────────────────────

    async function loadSimilar(famille: FamilleArticle): Promise<void> {
        // Reset panel state
        similarList.innerHTML = "";
        similarLoading.hidden = false;
        similarPanel.hidden = false;

        try {
            const lots = await getLotsForFamille(famille.id);
            similarLoading.hidden = true;

            const activeLots = lots.filter((l) => l.nombre > 0);

            if (activeLots.length === 0) {
                similarPanel.hidden = true;
                return;
            }

            // Re-render on +/− mutations (same famille, reload lots)
            function onMutated(): void {
                loadSimilar(famille);
            }

            similarList.appendChild(renderLotList(famille, lots, onMutated));
        } catch (err) {
            similarLoading.hidden = true;
            const errEl = document.createElement("p");
            errEl.className = "qs__location-empty";
            errEl.textContent =
                "Impossible de charger les emplacements existants.";
            similarList.appendChild(errEl);
            console.error(`[${mode}/similar]`, err);
        }
    }

    // ── Reset ─────────────────────────────────────────────────────────────

    function reset(): void {
        selectedFamille = null;
        selectedLocation = {
            piece: null,
            zone: null,
            rangement: null,
            emplacement: null,
        };
        stepLocation.hidden = true;
        stepSearch.hidden = false;
        similarPanel.hidden = true;
        similarList.innerHTML = "";
        quantiteInput.value = "1";
        locationSelects.reset();
        autocomplete.reset();
        syncConfirmBtn();
    }

    resetBtn.addEventListener("click", reset);

    // ── Confirm ───────────────────────────────────────────────────────────

    confirmBtn.addEventListener("click", async () => {
        if (!selectedFamille || !selectedLocation.emplacement || isLoading)
            return;

        isLoading = true;
        confirmBtn.disabled = true;

        const famille = selectedFamille;
        const emplacement = selectedLocation.emplacement;
        const quantite = Math.max(1, parseInt(quantiteInput.value, 10) || 1);

        try {
            const existingLot = await findLot(famille.id, emplacement.id);

            if (mode === "ranger") {
                if (existingLot) {
                    await patchLot(
                        existingLot.id,
                        existingLot.nombre + quantite,
                    );
                } else {
                    await createLot(
                        famille["@id"],
                        emplacement["@id"],
                        quantite,
                    );
                }
                showFeedback(
                    feedbackEl,
                    `\u2713 ${quantite}\u00a0\u00d7\u00a0${shortLabel(famille)} rang\u00e9(s).`,
                );
            } else {
                if (!existingLot || existingLot.nombre <= 0) {
                    showFeedback(
                        feedbackEl,
                        "Aucun stock disponible \u00e0 cet emplacement.",
                        true,
                    );
                    return;
                }
                if (existingLot.nombre < quantite) {
                    showFeedback(
                        feedbackEl,
                        `Stock insuffisant\u00a0: seulement ${existingLot.nombre} disponible(s).`,
                        true,
                    );
                    return;
                }
                await patchLot(existingLot.id, existingLot.nombre - quantite);
                showFeedback(
                    feedbackEl,
                    `\u2713 ${quantite}\u00a0\u00d7\u00a0${shortLabel(famille)} sorti(s).`,
                );
            }

            reset();
        } catch (err) {
            console.error(`[${mode}]`, err);
            showFeedback(
                feedbackEl,
                "Erreur lors de l\u2019op\u00e9ration. V\u00e9rifiez votre connexion.",
                true,
            );
        } finally {
            isLoading = false;
            syncConfirmBtn();
        }
    });

    function resetSearch(): void {
        autocomplete.reset();
    }

    return { focus: () => autocomplete.focus(), reset: resetSearch };
}
