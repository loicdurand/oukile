import { findLot, createLot, patchLot } from "../api";
import { resolveLocation } from "../store";
import type { FamilleArticle, Lot } from "../types";

// ── Helpers ───────────────────────────────────────────────────────────────

export function shortLabel(f: FamilleArticle): string {
    return (
        [f.marque, f.modele].filter(Boolean).join(" ") ||
        f.description ||
        "Article"
    );
}

// ── Confirmation modal ─────────────────────────────────────────────────────
// Reuses the same singleton <dialog> as trouver.ts (same MODAL_ID).

interface ModalOptions {
    message: string;
    onConfirm: () => Promise<void>;
}

function getModal(): {
    root: HTMLDialogElement;
    messageEl: HTMLElement;
    confirmBtn: HTMLButtonElement;
    cancelBtn: HTMLButtonElement;
} {
    const MODAL_ID = "qs-confirm-modal";
    let root = document.getElementById(MODAL_ID) as HTMLDialogElement | null;

    if (!root) {
        root = document.createElement("dialog") as HTMLDialogElement;
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

        root.addEventListener("click", (e) => {
            if (e.target === root) root!.close();
        });
    }

    return {
        root,
        messageEl: root.querySelector("#qs-modal-message") as HTMLElement,
        confirmBtn: root.querySelector("#qs-modal-confirm") as HTMLButtonElement,
        cancelBtn: root.querySelector("#qs-modal-cancel") as HTMLButtonElement,
    };
}

function openModal({ message, onConfirm }: ModalOptions): void {
    const { root, messageEl, confirmBtn, cancelBtn } = getModal();

    messageEl.textContent = message;

    const newConfirm = confirmBtn.cloneNode(true) as HTMLButtonElement;
    const newCancel = cancelBtn.cloneNode(true) as HTMLButtonElement;
    confirmBtn.replaceWith(newConfirm);
    cancelBtn.replaceWith(newCancel);

    newCancel.addEventListener("click", () => root.close());

    newConfirm.addEventListener("click", async () => {
        newConfirm.disabled = true;
        newConfirm.textContent = "…";
        try {
            await onConfirm();
        } finally {
            newConfirm.disabled = false;
            newConfirm.textContent = "Confirmer";
            root.close();
        }
    });

    root.showModal();
    newCancel.focus();
}

// ── renderLotList ──────────────────────────────────────────────────────────

/**
 * Renders a `<ul class="qs__location-list">` of active lots for the given
 * famille, complete with ×N quantity display and +/− quick-action buttons.
 *
 * @param famille  The famille whose lots are displayed.
 * @param lots     The preloaded lots (already filtered to the current unite).
 * @param onMutated  Called after a successful +/− action so the caller can
 *                   refresh the list.
 * @returns The `<ul>` element, or a `<p class="qs__location-empty">` when
 *          there is no active stock.
 */
export function renderLotList(
    famille: FamilleArticle,
    lots: Lot[],
    onMutated: () => void,
): HTMLElement {
    const activeLots = lots.filter((l) => l.nombre > 0);

    if (activeLots.length === 0) {
        const empty = document.createElement("p");
        empty.className = "qs__location-empty";
        empty.textContent = "Aucun stock disponible dans cette unité.";
        return empty;
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

    // If all lots resolved to unknown emplacements (shouldn't happen normally)
    if (list.children.length === 0) {
        const empty = document.createElement("p");
        empty.className = "qs__location-empty";
        empty.textContent = "Stock épuisé dans cette unité.";
        return empty;
    }

    return list;
}
