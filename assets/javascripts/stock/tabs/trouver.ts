import {
    searchFamilles,
    getLotsForFamille,
    findLot,
    createLot,
    patchLot,
} from "../api";
import { resolveLocation } from "../store";
import { Autocomplete } from "../components/autocomplete";
import type { FamilleArticle, Lot } from "../types";

// ── Modal ─────────────────────────────────────────────────────────────────

interface ModalOptions {
    message: string;
    onConfirm: () => Promise<void>;
}

/**
 * Lazily creates a single shared DSFR-style confirmation modal appended to
 * <body>. Subsequent calls reuse the same DOM node.
 */
function getModal(): {
    root: HTMLElement;
    messageEl: HTMLElement;
    confirmBtn: HTMLButtonElement;
    cancelBtn: HTMLButtonElement;
} {
    const MODAL_ID = "qs-confirm-modal";
    let root = document.getElementById(MODAL_ID) as HTMLElement | null;

    if (!root) {
        root = document.createElement("dialog");
        root.id = MODAL_ID;
        root.className = "qs__modal";
        root.setAttribute("aria-labelledby", "qs-modal-title");
        root.setAttribute("aria-modal", "true");

        root.innerHTML = `
            <div class="qs__modal-card">
                <div class="qs__modal-header">
                    <h2 class="qs__modal-title" id="qs-modal-title">Confirmation</h2>
                </div>
                <div class="qs__modal-body">
                    <p class="qs__modal-message" id="qs-modal-message"></p>
                </div>
                <div class="qs__modal-footer">
                    <button class="qs__modal-btn qs__modal-btn--cancel" id="qs-modal-cancel" type="button">
                        Annuler
                    </button>
                    <button class="qs__modal-btn qs__modal-btn--confirm" id="qs-modal-confirm" type="button">
                        Confirmer
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(root);

        // Close on backdrop click
        root.addEventListener("click", (e) => {
            if (e.target === root) (root as HTMLDialogElement).close();
        });
    }

    return {
        root,
        messageEl: root.querySelector("#qs-modal-message") as HTMLElement,
        confirmBtn: root.querySelector(
            "#qs-modal-confirm",
        ) as HTMLButtonElement,
        cancelBtn: root.querySelector("#qs-modal-cancel") as HTMLButtonElement,
    };
}

function openModal({ message, onConfirm }: ModalOptions): void {
    const { root, messageEl, confirmBtn, cancelBtn } = getModal();
    const dialog = root as HTMLDialogElement;

    messageEl.textContent = message;

    // Replace listeners (clone trick to avoid stacking handlers)
    const newConfirm = confirmBtn.cloneNode(true) as HTMLButtonElement;
    const newCancel = cancelBtn.cloneNode(true) as HTMLButtonElement;
    confirmBtn.replaceWith(newConfirm);
    cancelBtn.replaceWith(newCancel);

    newCancel.addEventListener("click", () => dialog.close());

    newConfirm.addEventListener("click", async () => {
        newConfirm.disabled = true;
        newConfirm.textContent = "…";
        try {
            await onConfirm();
        } finally {
            newConfirm.disabled = false;
            newConfirm.textContent = "Confirmer";
            dialog.close();
        }
    });

    dialog.showModal();
    newCancel.focus();
}

// ── Helpers ───────────────────────────────────────────────────────────────

function shortLabel(f: FamilleArticle): string {
    return (
        [f.marque, f.modele].filter(Boolean).join(" ") ||
        f.description ||
        "Article"
    );
}

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

    const activeLots = lots.filter((l) => l.nombre > 0);

    if (activeLots.length === 0) {
        const empty = document.createElement("p");
        empty.className = "qs__location-empty";
        empty.textContent = "Aucun stock disponible dans cette unité.";
        card.appendChild(empty);
        return card;
    }

    const list = document.createElement("ul");
    list.className = "qs__location-list";

    for (const lot of activeLots) {
        const path = resolveLocation(lot.emplacement);
        if (!path) continue;

        const li = document.createElement("li");
        li.className = "qs__location-item";

        // Path label
        const pathEl = document.createElement("span");
        pathEl.className = "qs__location-path";
        pathEl.textContent = `${path.piece.nom} › ${path.zone.nom} › ${path.rangement.nom} › ${path.emplacement.nom}`;
        li.appendChild(pathEl);

        // Right-side actions group
        const actions = document.createElement("div");
        actions.className = "qs__location-actions";

        // − button
        const minusBtn = document.createElement("button");
        minusBtn.type = "button";
        minusBtn.className = "qs__qty-btn qs__qty-btn--minus";
        minusBtn.setAttribute("aria-label", `Sortir un ${shortLabel(famille)}`);
        minusBtn.setAttribute("title", "Sortir 1");
        minusBtn.textContent = "−";

        // Quantity display
        const qty = document.createElement("span");
        qty.className = "qs__location-qty";
        qty.textContent = `×${lot.nombre}`;

        // + button
        const plusBtn = document.createElement("button");
        plusBtn.type = "button";
        plusBtn.className = "qs__qty-btn qs__qty-btn--plus";
        plusBtn.setAttribute("aria-label", `Ranger un ${shortLabel(famille)}`);
        plusBtn.setAttribute("title", "Ranger 1");
        plusBtn.textContent = "+";

        actions.appendChild(minusBtn);
        actions.appendChild(qty);
        actions.appendChild(plusBtn);
        li.appendChild(actions);
        list.appendChild(li);

        // ── Button handlers ───────────────────────────────────────────────

        plusBtn.addEventListener("click", () => {
            openModal({
                message: `Ranger 1 × ${shortLabel(famille)} à « ${path.emplacement.nom} » ?`,
                onConfirm: async () => {
                    const existing = await findLot(
                        famille.id,
                        path.emplacement.id,
                    );
                    if (existing) {
                        await patchLot(existing.id, existing.nombre + 1);
                    } else {
                        await createLot(
                            famille["@id"],
                            path.emplacement["@id"],
                            1,
                        );
                    }
                    onMutated();
                },
            });
        });

        minusBtn.addEventListener("click", () => {
            if (lot.nombre <= 0) return;
            openModal({
                message: `Sortir 1 × ${shortLabel(famille)} de « ${path.emplacement.nom} » ?`,
                onConfirm: async () => {
                    const existing = await findLot(
                        famille.id,
                        path.emplacement.id,
                    );
                    if (!existing || existing.nombre <= 0) return;
                    await patchLot(existing.id, existing.nombre - 1);
                    onMutated();
                },
            });
        });
    }

    if (list.children.length === 0) {
        const empty = document.createElement("p");
        empty.className = "qs__location-empty";
        empty.textContent = "Stock épuisé dans cette unité.";
        card.appendChild(empty);
    } else {
        card.appendChild(list);
    }

    return card;
}

// ── Init ──────────────────────────────────────────────────────────────────

export function initTrouver(): () => void {
    const input = document.getElementById("trouver-query") as HTMLInputElement;
    const dropdown = document.getElementById(
        "trouver-dropdown",
    ) as HTMLUListElement;
    const results = document.getElementById("trouver-results") as HTMLElement;
    const loading = document.getElementById("trouver-loading") as HTMLElement;

    let currentFamille: FamilleArticle | null = null;

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

    async function onFamilleSelected(famille: FamilleArticle): Promise<void> {
        currentFamille = famille;
        await loadAndRender(famille);
    }

    const autocomplete = new Autocomplete(
        input,
        dropdown,
        searchFamilles,
        onFamilleSelected,
    );

    return () => autocomplete.focus();
}
