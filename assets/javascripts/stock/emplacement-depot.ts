import { Autocomplete } from "./components/autocomplete";
import { searchFamilles } from "./api";
import { findLot, createLot, patchLot } from "./api";
import { shortLabel } from "./components/lot-list";
import type { FamilleArticle } from "./types";

// ── Constants ─────────────────────────────────────────────────────────────

const MODAL_ID = "depot-modal";

// ── Feedback ──────────────────────────────────────────────────────────────

function showFeedback(el: HTMLElement, message: string, isError = false): void {
  el.textContent = message;
  el.className = `fr-alert fr-alert--sm ${isError ? "fr-alert--warning" : "fr-alert--success"}`;
  el.hidden = false;
  setTimeout(() => {
    el.hidden = true;
  }, 3500);
}

// ── Modal DOM creation ────────────────────────────────────────────────────

function buildModal(): HTMLDialogElement {
  const dialog = document.createElement("dialog");
  dialog.id = MODAL_ID;
  dialog.className = "fr-modal";
  dialog.setAttribute("aria-labelledby", "depot-modal-title");
  dialog.setAttribute("data-fr-concealing-backdrop", "true");

  dialog.innerHTML = `
        <div class="fr-container fr-container--fluid fr-container-md">
            <div class="fr-grid-row fr-grid-row--center">
                <div class="fr-col-12 fr-col-md-10 fr-col-lg-8">
                    <div class="fr-modal__body">

                        <div class="fr-modal__header">
                            <button
                                aria-controls="${MODAL_ID}"
                                title="Fermer"
                                type="button"
                                id="depot-modal-close"
                                class="fr-btn--close fr-btn"
                            >Fermer</button>
                        </div>

                        <div class="fr-modal__content">
                            <h2 id="depot-modal-title" class="fr-modal__title">
                                <span class="fr-icon-archive-line fr-icon--lg" aria-hidden="true"></span>
                                Déposer des articles
                            </h2>

                            <p class="fr-text--sm fr-text-mention--grey" id="depot-modal-location"></p>

                            <!-- Step 1 : article search -->
                            <div id="depot-step-search">
                                <div class="fr-input-group">
                                    <label class="fr-label" for="depot-query">
                                        Rechercher un article
                                        <span class="fr-hint-text">Marque, modèle, description…</span>
                                    </label>
                                    <div class="qs__autocomplete">
                                        <input
                                            id="depot-query"
                                            class="fr-input"
                                            type="search"
                                            autocomplete="off"
                                            placeholder="Marque, modèle, description…"
                                            aria-autocomplete="list"
                                            aria-expanded="false"
                                            aria-controls="depot-dropdown"
                                        />
                                        <ul
                                            id="depot-dropdown"
                                            class="qs__dropdown"
                                            role="listbox"
                                            hidden
                                        ></ul>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 2 : quantity + confirm -->
                            <div id="depot-step-quantity" hidden>
                                <div class="qs__famille-badge fr-mb-3w">
                                    <span id="depot-famille-label"></span>
                                    <button
                                        type="button"
                                        class="qs__famille-reset fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-close-line"
                                        id="depot-article-reset"
                                        aria-label="Changer d'article"
                                        title="Changer d'article"
                                    ></button>
                                </div>

                                <div class="fr-input-group">
                                    <label class="fr-label" for="depot-quantite">
                                        Quantité à déposer
                                    </label>
                                    <div class="depot__qty-controls">
                                        <button
                                            type="button"
                                            class="qs__qty-btn qs__qty-btn--minus"
                                            id="depot-qty-minus"
                                            aria-label="Diminuer la quantité"
                                        >−</button>
                                        <input
                                            id="depot-quantite"
                                            class="fr-input depot__qty-input"
                                            type="number"
                                            min="1"
                                            value="1"
                                            aria-label="Quantité"
                                        />
                                        <button
                                            type="button"
                                            class="qs__qty-btn qs__qty-btn--plus"
                                            id="depot-qty-plus"
                                            aria-label="Augmenter la quantité"
                                        >+</button>
                                    </div>
                                </div>

                                <div
                                    id="depot-feedback"
                                    hidden
                                    aria-live="polite"
                                ></div>
                            </div>

                        </div>

                        <div class="fr-modal__footer">
                            <ul class="fr-btns-group fr-btns-group--right fr-btns-group--inline fr-btns-group--icon-left fr-btns-group--lg">
                                <li>
                                    <button
                                        type="button"
                                        class="fr-btn fr-btn--secondary"
                                        id="depot-reset"
                                        aria-controls="${MODAL_ID}"
                                    >
                                        Annuler
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        class="fr-btn fr-icon-archive-line"
                                        id="depot-confirm"
                                        disabled
                                    >
                                        Confirmer le dépôt
                                    </button>
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(dialog);

  return dialog;
}

// ── Modal controller ──────────────────────────────────────────────────────

class DepotModal {
  private readonly dialog: HTMLDialogElement;

  // DOM refs
  private readonly locationLabel: HTMLElement;
  private readonly stepSearch: HTMLElement;
  private readonly stepQuantity: HTMLElement;
  private readonly queryInput: HTMLInputElement;
  private readonly dropdown: HTMLUListElement;
  private readonly familleLabel: HTMLElement;
  private readonly articleResetBtn: HTMLButtonElement;
  private readonly quantiteInput: HTMLInputElement;
  private readonly qtyMinusBtn: HTMLButtonElement;
  private readonly qtyPlusBtn: HTMLButtonElement;
  private readonly confirmBtn: HTMLButtonElement;
  private readonly resetBtn: HTMLButtonElement;
  private readonly feedbackEl: HTMLElement;
  private readonly closeBtn: HTMLButtonElement;

  // State
  private emplacementId: number | null = null;
  private emplacementIri: string | null = null;
  private selectedFamille: FamilleArticle | null = null;
  private isLoading = false;

  private readonly autocomplete: Autocomplete;

  constructor(dialog: HTMLDialogElement) {
    this.dialog = dialog;

    this.locationLabel = dialog.querySelector(
      "#depot-modal-location",
    ) as HTMLElement;
    this.stepSearch = dialog.querySelector("#depot-step-search") as HTMLElement;
    this.stepQuantity = dialog.querySelector(
      "#depot-step-quantity",
    ) as HTMLElement;
    this.queryInput = dialog.querySelector("#depot-query") as HTMLInputElement;
    this.dropdown = dialog.querySelector("#depot-dropdown") as HTMLUListElement;
    this.familleLabel = dialog.querySelector(
      "#depot-famille-label",
    ) as HTMLElement;
    this.articleResetBtn = dialog.querySelector(
      "#depot-article-reset",
    ) as HTMLButtonElement;
    this.quantiteInput = dialog.querySelector(
      "#depot-quantite",
    ) as HTMLInputElement;
    this.qtyMinusBtn = dialog.querySelector(
      "#depot-qty-minus",
    ) as HTMLButtonElement;
    this.qtyPlusBtn = dialog.querySelector(
      "#depot-qty-plus",
    ) as HTMLButtonElement;
    this.confirmBtn = dialog.querySelector(
      "#depot-confirm",
    ) as HTMLButtonElement;
    this.resetBtn = dialog.querySelector("#depot-reset") as HTMLButtonElement;
    this.feedbackEl = dialog.querySelector("#depot-feedback") as HTMLElement;
    this.closeBtn = dialog.querySelector(
      "#depot-modal-close",
    ) as HTMLButtonElement;

    this.autocomplete = new Autocomplete(
      this.queryInput,
      this.dropdown,
      searchFamilles,
      (famille) => this.onFamilleSelected(famille),
    );

    this.bindEvents();
  }

  // ── Event wiring ──────────────────────────────────────────────────────

  private bindEvents(): void {
    // The DSFR handles closing via aria-controls on the close & cancel buttons.
    // We only need to react to the native "close" event (already wired below).
    this.closeBtn.addEventListener("click", () => this.dialog.close());

    this.articleResetBtn.addEventListener("click", () => {
      this.resetArticleStep();
    });

    this.resetBtn.addEventListener("click", () => {
      this.dialog.close();
    });

    // +/− quantity controls
    this.qtyMinusBtn.addEventListener("click", () => {
      const v = Math.max(1, parseInt(this.quantiteInput.value, 10) || 1);
      this.quantiteInput.value = String(Math.max(1, v - 1));
    });

    this.qtyPlusBtn.addEventListener("click", () => {
      const v = Math.max(1, parseInt(this.quantiteInput.value, 10) || 1);
      this.quantiteInput.value = String(v + 1);
    });

    // Keep confirm btn state in sync with manual input changes
    this.quantiteInput.addEventListener("input", () => this.syncConfirmBtn());

    this.confirmBtn.addEventListener("click", () => this.confirm());

    // Close on Escape is handled natively by <dialog>; restore state after close
    this.dialog.addEventListener("close", () => this.resetFull());
  }

  // ── Public: open for a specific emplacement ───────────────────────────

  open(emplacementId: number, emplacementLabel: string): void {
    this.emplacementId = emplacementId;
    this.emplacementIri = `/api/emplacements/${emplacementId}`;
    this.locationLabel.textContent = `Emplacement : ${emplacementLabel}`;
    this.resetFull();
    // Use the DSFR JS API to open the modal so it manages focus trap & scroll lock
    const dsfr = (window as any).dsfr;
    if (dsfr?.modal) {
      dsfr(this.dialog).modal.disclose();
    } else {
      this.dialog.showModal();
    }
    this.queryInput.focus();
  }

  // ── Internal helpers ──────────────────────────────────────────────────

  private onFamilleSelected(famille: FamilleArticle): void {
    this.selectedFamille = famille;
    this.familleLabel.textContent = shortLabel(famille);
    this.stepSearch.hidden = true;
    this.stepQuantity.hidden = false;
    this.quantiteInput.value = "1";
    this.syncConfirmBtn();
    this.quantiteInput.focus();
  }

  private syncConfirmBtn(): void {
    const qty = parseInt(this.quantiteInput.value, 10);
    this.confirmBtn.disabled =
      !this.selectedFamille ||
      !this.emplacementIri ||
      isNaN(qty) ||
      qty < 1 ||
      this.isLoading;
  }

  private resetArticleStep(): void {
    this.selectedFamille = null;
    this.stepQuantity.hidden = true;
    this.stepSearch.hidden = false;
    this.autocomplete.reset();
    this.queryInput.focus();
    this.syncConfirmBtn();
  }

  private resetFull(): void {
    this.resetArticleStep();
    this.quantiteInput.value = "1";
    this.feedbackEl.hidden = true;
  }

  private async confirm(): Promise<void> {
    if (
      !this.selectedFamille ||
      !this.emplacementIri ||
      !this.emplacementId ||
      this.isLoading
    )
      return;

    const famille = this.selectedFamille;
    const empId = this.emplacementId;
    const empIri = this.emplacementIri;
    const quantite = Math.max(1, parseInt(this.quantiteInput.value, 10) || 1);

    this.isLoading = true;
    this.confirmBtn.disabled = true;
    this.confirmBtn.textContent = "…";

    try {
      const existingLot = await findLot(famille.id, empId);

      if (existingLot) {
        await patchLot(existingLot.id, existingLot.nombre + quantite);
      } else {
        await createLot(famille["@id"], empIri, quantite);
      }

      showFeedback(
        this.feedbackEl,
        `✓ ${quantite} × ${shortLabel(famille)} rangé(s) avec succès.`,
      );

      // Brief pause to let the user read the confirmation, then close
      setTimeout(() => {
        this.dialog.close();
        // Reload the page so the lot table reflects the change
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error("[DepotModal]", err);
      showFeedback(
        this.feedbackEl,
        "Erreur lors de l'opération. Vérifiez votre connexion.",
        true,
      );
    } finally {
      this.isLoading = false;
      this.confirmBtn.textContent = "Confirmer le dépôt";
      this.syncConfirmBtn();
    }
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────

let modalInstance: DepotModal | null = null;

function getModal(): DepotModal {
  if (!modalInstance) {
    const dialog = buildModal();
    modalInstance = new DepotModal(dialog);
  }
  return modalInstance;
}

// ── Public init ───────────────────────────────────────────────────────────

/**
 * Binds click handlers on every `[data-depot-emplacement-id]` button found
 * in the page. When clicked, opens the depot modal pre-targeted at that
 * emplacement.
 *
 * Call once after DOMContentLoaded.
 */
export function initEmplacementDepot(): void {
  document.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest<HTMLElement>(
      "[data-depot-emplacement-id]",
    );
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const id = parseInt(btn.dataset.depotEmplacementId ?? "", 10);
    const label = btn.dataset.depotEmplacementLabel ?? `#${id}`;

    if (isNaN(id)) return;

    getModal().open(id, label);
  });
}
