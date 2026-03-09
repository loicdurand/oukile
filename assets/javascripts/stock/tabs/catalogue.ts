import {
    getCategories,
    createCategorie,
    patchCategorie,
    deleteCategorie,
    getFamilles,
    createFamille,
    patchFamille,
    deleteFamille,
} from "../api";
import type { Categorie, FamilleArticle } from "../types";

// ── State ─────────────────────────────────────────────────────────────────

let categories: Categorie[] = [];
let familles: FamilleArticle[] = [];
let familleFilter = "";
let categorieFilter = "";

// ── DOM refs (set in init) ─────────────────────────────────────────────────

let familleTableBody: HTMLTableSectionElement;
let categorieTableBody: HTMLTableSectionElement;
let familleSearch: HTMLInputElement;
let categorieSearch: HTMLInputElement;
let familleCount: HTMLElement;
let categorieCount: HTMLElement;
let feedbackEl: HTMLElement;

// ── Feedback ──────────────────────────────────────────────────────────────

function showFeedback(message: string, isError = false): void {
    feedbackEl.textContent = message;
    feedbackEl.className = `cat__feedback ${isError ? "cat__feedback--error" : "cat__feedback--success"}`;
    feedbackEl.hidden = false;
    setTimeout(() => {
        feedbackEl.hidden = true;
    }, 4000);
}

// ── Shared modal helpers ───────────────────────────────────────────────────

function getConfirmModal(): {
    root: HTMLDialogElement;
    messageEl: HTMLElement;
    confirmBtn: HTMLButtonElement;
    cancelBtn: HTMLButtonElement;
} {
    const MODAL_ID = "cat-confirm-modal";
    let root = document.getElementById(MODAL_ID) as HTMLDialogElement | null;

    if (!root) {
        root = document.createElement("dialog") as HTMLDialogElement;
        root.id = MODAL_ID;
        root.className = "qs__modal";
        root.setAttribute("aria-labelledby", "cat-modal-title");
        root.setAttribute("aria-modal", "true");
        root.innerHTML = `
            <div class="qs__modal-card">
                <div class="qs__modal-header">
                    <h2 class="qs__modal-title" id="cat-modal-title">Confirmation</h2>
                </div>
                <div class="qs__modal-body">
                    <p class="qs__modal-message" id="cat-modal-message"></p>
                </div>
                <div class="qs__modal-footer">
                    <button class="qs__modal-btn qs__modal-btn--cancel" id="cat-modal-cancel" type="button">Annuler</button>
                    <button class="qs__modal-btn qs__modal-btn--confirm qs__modal-btn--danger" id="cat-modal-confirm" type="button">Supprimer</button>
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
        messageEl: root.querySelector("#cat-modal-message") as HTMLElement,
        confirmBtn: root.querySelector("#cat-modal-confirm") as HTMLButtonElement,
        cancelBtn: root.querySelector("#cat-modal-cancel") as HTMLButtonElement,
    };
}

function openConfirmModal(message: string, onConfirm: () => Promise<void>): void {
    const { root, messageEl, confirmBtn, cancelBtn } = getConfirmModal();

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
            newConfirm.textContent = "Supprimer";
            root.close();
        }
    });

    root.showModal();
    newCancel.focus();
}

// ── Form modal ─────────────────────────────────────────────────────────────

interface FormField {
    id: string;
    label: string;
    type?: "text" | "select";
    options?: { value: string; label: string }[];
    required?: boolean;
}

interface FormModalOptions {
    title: string;
    fields: FormField[];
    initialValues?: Record<string, string>;
    confirmLabel?: string;
    onConfirm: (values: Record<string, string>) => Promise<void>;
}

function openFormModal(opts: FormModalOptions): void {
    const MODAL_ID = "cat-form-modal";
    let root = document.getElementById(MODAL_ID) as HTMLDialogElement | null;

    if (!root) {
        root = document.createElement("dialog") as HTMLDialogElement;
        root.id = MODAL_ID;
        root.className = "qs__modal qs__modal--form";
        root.setAttribute("aria-modal", "true");
        document.body.appendChild(root);
        root.addEventListener("click", (e) => {
            if (e.target === root) root!.close();
        });
    }

    // Build fields HTML
    const fieldsHtml = opts.fields.map((f) => {
        if (f.type === "select") {
            const optionsHtml = (f.options ?? [])
                .map((o) => `<option value="${o.value}">${o.label}</option>`)
                .join("");
            return `
                <div class="cat__form-group">
                    <label class="fr-label" for="form-field-${f.id}">
                        ${f.label}${f.required ? " <span aria-hidden='true'>*</span>" : ""}
                    </label>
                    <select
                        class="fr-select cat__form-select"
                        id="form-field-${f.id}"
                        name="${f.id}"
                        ${f.required ? "required" : ""}
                    >
                        <option value="">— Choisir —</option>
                        ${optionsHtml}
                    </select>
                </div>`;
        }
        return `
            <div class="cat__form-group">
                <label class="fr-label" for="form-field-${f.id}">
                    ${f.label}${f.required ? " <span aria-hidden='true'>*</span>" : ""}
                </label>
                <input
                    class="fr-input cat__form-input"
                    type="text"
                    id="form-field-${f.id}"
                    name="${f.id}"
                    ${f.required ? "required" : ""}
                    autocomplete="off"
                />
            </div>`;
    }).join("");

    root.innerHTML = `
        <div class="qs__modal-card">
            <div class="qs__modal-header">
                <h2 class="qs__modal-title" id="cat-form-title">${opts.title}</h2>
            </div>
            <div class="qs__modal-body">
                <form id="cat-form" novalidate>
                    ${fieldsHtml}
                    <div class="cat__form-error" id="cat-form-error" hidden></div>
                </form>
            </div>
            <div class="qs__modal-footer">
                <button class="qs__modal-btn qs__modal-btn--cancel" id="cat-form-cancel" type="button">Annuler</button>
                <button class="qs__modal-btn qs__modal-btn--confirm" id="cat-form-submit" type="submit" form="cat-form">
                    ${opts.confirmLabel ?? "Enregistrer"}
                </button>
            </div>
        </div>
    `;

    root.setAttribute("aria-labelledby", "cat-form-title");

    // Populate initial values
    if (opts.initialValues) {
        for (const [key, val] of Object.entries(opts.initialValues)) {
            const el = root.querySelector(`[name="${key}"]`) as
                | HTMLInputElement
                | HTMLSelectElement
                | null;
            if (el) el.value = val;
        }
    }

    const form = root.querySelector("#cat-form") as HTMLFormElement;
    const submitBtn = root.querySelector("#cat-form-submit") as HTMLButtonElement;
    const cancelBtn = root.querySelector("#cat-form-cancel") as HTMLButtonElement;
    const errorEl = root.querySelector("#cat-form-error") as HTMLElement;

    cancelBtn.addEventListener("click", () => root!.close());

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorEl.hidden = true;

        const values: Record<string, string> = {};
        opts.fields.forEach((f) => {
            const el = form.querySelector(`[name="${f.id}"]`) as
                | HTMLInputElement
                | HTMLSelectElement
                | null;
            values[f.id] = el?.value.trim() ?? "";
        });

        // Client-side required check
        const missing = opts.fields.filter(
            (f) => f.required && !values[f.id],
        );
        if (missing.length) {
            errorEl.textContent = `Champ(s) obligatoire(s) manquant(s) : ${missing.map((f) => f.label).join(", ")}.`;
            errorEl.hidden = false;
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "…";
        try {
            await opts.onConfirm(values);
            root!.close();
        } catch (err) {
            errorEl.textContent =
                err instanceof Error ? err.message : "Erreur serveur.";
            errorEl.hidden = false;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = opts.confirmLabel ?? "Enregistrer";
        }
    });

    root.showModal();
    (root.querySelector(".cat__form-input, .cat__form-select") as HTMLElement | null)?.focus();
}

// ── Rendering ──────────────────────────────────────────────────────────────

function renderFamilles(): void {
    const filtered = familles.filter((f) => {
        if (!familleFilter) return true;
        const q = familleFilter.toLowerCase();
        return (
            f.marque?.toLowerCase().includes(q) ||
            f.modele?.toLowerCase().includes(q) ||
            f.description?.toLowerCase().includes(q) ||
            f.categorie?.nom?.toLowerCase().includes(q)
        );
    });

    familleCount.textContent = `${filtered.length} article${filtered.length > 1 ? "s" : ""}`;
    familleTableBody.innerHTML = "";

    if (filtered.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="5" class="cat__empty">Aucun article trouvé.</td>`;
        familleTableBody.appendChild(tr);
        return;
    }

    for (const f of filtered) {
        const tr = document.createElement("tr");
        tr.className = "cat__row";

        const label =
            [f.marque, f.modele].filter(Boolean).join(" ") || "(sans nom)";

        tr.innerHTML = `
            <td class="cat__cell cat__cell--main">${label}</td>
            <td class="cat__cell">${f.description ?? "<span class='cat__muted'>—</span>"}</td>
            <td class="cat__cell">
                <span class="cat__badge">${f.categorie?.nom ?? "?"}</span>
            </td>
            <td class="cat__cell cat__cell--actions">
                <button class="cat__action-btn cat__action-btn--edit" data-id="${f.id}" title="Modifier" aria-label="Modifier ${label}">
                    <span aria-hidden="true">✏️</span>
                </button>
                <button class="cat__action-btn cat__action-btn--delete" data-id="${f.id}" title="Supprimer" aria-label="Supprimer ${label}">
                    <span aria-hidden="true">🗑️</span>
                </button>
            </td>
        `;

        tr.querySelector(".cat__action-btn--edit")!.addEventListener(
            "click",
            () => openEditFamilleModal(f),
        );
        tr.querySelector(".cat__action-btn--delete")!.addEventListener(
            "click",
            () => confirmDeleteFamille(f),
        );

        familleTableBody.appendChild(tr);
    }
}

function renderCategories(): void {
    const filtered = categories.filter((c) => {
        if (!categorieFilter) return true;
        return c.nom.toLowerCase().includes(categorieFilter.toLowerCase());
    });

    categorieCount.textContent = `${filtered.length} catégorie${filtered.length > 1 ? "s" : ""}`;
    categorieTableBody.innerHTML = "";

    if (filtered.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="2" class="cat__empty">Aucune catégorie trouvée.</td>`;
        categorieTableBody.appendChild(tr);
        return;
    }

    for (const c of filtered) {
        const count = familles.filter(
            (f) => f.categorie?.id === c.id,
        ).length;

        const tr = document.createElement("tr");
        tr.className = "cat__row";
        tr.innerHTML = `
            <td class="cat__cell cat__cell--main">${c.nom}</td>
            <td class="cat__cell cat__cell--count">
                <span class="cat__count-badge">${count}</span>
            </td>
            <td class="cat__cell cat__cell--actions">
                <button class="cat__action-btn cat__action-btn--edit" data-id="${c.id}" title="Modifier" aria-label="Modifier ${c.nom}">
                    <span aria-hidden="true">✏️</span>
                </button>
                <button class="cat__action-btn cat__action-btn--delete" data-id="${c.id}" title="Supprimer" aria-label="Supprimer ${c.nom}" ${count > 0 ? "disabled" : ""}>
                    <span aria-hidden="true">🗑️</span>
                </button>
            </td>
        `;

        if (count === 0) {
            tr.querySelector(".cat__action-btn--delete")!.addEventListener(
                "click",
                () => confirmDeleteCategorie(c),
            );
        }

        tr.querySelector(".cat__action-btn--edit")!.addEventListener(
            "click",
            () => openEditCategorieModal(c),
        );

        categorieTableBody.appendChild(tr);
    }
}

function renderAll(): void {
    renderFamilles();
    renderCategories();
}

// ── Reload helpers ─────────────────────────────────────────────────────────

async function reloadAll(): Promise<void> {
    [categories, familles] = await Promise.all([
        getCategories(),
        getFamilles(),
    ]);
    renderAll();
}

// ── Famille actions ────────────────────────────────────────────────────────

function openCreateFamilleModal(): void {
    openFormModal({
        title: "Nouvel article",
        confirmLabel: "Créer",
        fields: [
            {
                id: "categorie",
                label: "Catégorie",
                type: "select",
                required: true,
                options: categories.map((c) => ({
                    value: c["@id"],
                    label: c.nom,
                })),
            },
            { id: "marque", label: "Marque" },
            { id: "modele", label: "Modèle" },
            { id: "description", label: "Description" },
        ],
        onConfirm: async (values) => {
            await createFamille({
                categorieIri: values["categorie"],
                marque: values["marque"] || null,
                modele: values["modele"] || null,
                description: values["description"] || null,
            });
            await reloadAll();
            showFeedback("Article créé avec succès.");
        },
    });
}

function openEditFamilleModal(f: FamilleArticle): void {
    const label =
        [f.marque, f.modele].filter(Boolean).join(" ") || f.description || "cet article";

    openFormModal({
        title: `Modifier « ${label} »`,
        confirmLabel: "Enregistrer",
        fields: [
            {
                id: "categorie",
                label: "Catégorie",
                type: "select",
                required: true,
                options: categories.map((c) => ({
                    value: c["@id"],
                    label: c.nom,
                })),
            },
            { id: "marque", label: "Marque" },
            { id: "modele", label: "Modèle" },
            { id: "description", label: "Description" },
        ],
        initialValues: {
            categorie: f.categorie["@id"],
            marque: f.marque ?? "",
            modele: f.modele ?? "",
            description: f.description ?? "",
        },
        onConfirm: async (values) => {
            await patchFamille(f.id, {
                categorieIri: values["categorie"],
                marque: values["marque"] || null,
                modele: values["modele"] || null,
                description: values["description"] || null,
            });
            await reloadAll();
            showFeedback("Article modifié avec succès.");
        },
    });
}

function confirmDeleteFamille(f: FamilleArticle): void {
    const label =
        [f.marque, f.modele].filter(Boolean).join(" ") || f.description || "cet article";

    openConfirmModal(
        `Supprimer définitivement « ${label} » ? Cette action est irréversible.`,
        async () => {
            await deleteFamille(f.id);
            await reloadAll();
            showFeedback("Article supprimé.");
        },
    );
}

// ── Categorie actions ──────────────────────────────────────────────────────

function openCreateCategorieModal(): void {
    openFormModal({
        title: "Nouvelle catégorie",
        confirmLabel: "Créer",
        fields: [{ id: "nom", label: "Nom", required: true }],
        onConfirm: async (values) => {
            await createCategorie(values["nom"]);
            await reloadAll();
            showFeedback("Catégorie créée avec succès.");
        },
    });
}

function openEditCategorieModal(c: Categorie): void {
    openFormModal({
        title: `Modifier « ${c.nom} »`,
        confirmLabel: "Enregistrer",
        fields: [{ id: "nom", label: "Nom", required: true }],
        initialValues: { nom: c.nom },
        onConfirm: async (values) => {
            await patchCategorie(c.id, values["nom"]);
            await reloadAll();
            showFeedback("Catégorie modifiée avec succès.");
        },
    });
}

function confirmDeleteCategorie(c: Categorie): void {
    openConfirmModal(
        `Supprimer la catégorie « ${c.nom} » ? Cette action est irréversible.`,
        async () => {
            await deleteCategorie(c.id);
            await reloadAll();
            showFeedback("Catégorie supprimée.");
        },
    );
}

// ── Init ──────────────────────────────────────────────────────────────────

export function initCatalogue(): () => void {
    familleTableBody = document.getElementById(
        "cat-famille-tbody",
    ) as HTMLTableSectionElement;
    categorieTableBody = document.getElementById(
        "cat-categorie-tbody",
    ) as HTMLTableSectionElement;
    familleSearch = document.getElementById(
        "cat-famille-search",
    ) as HTMLInputElement;
    categorieSearch = document.getElementById(
        "cat-categorie-search",
    ) as HTMLInputElement;
    familleCount = document.getElementById("cat-famille-count") as HTMLElement;
    categorieCount = document.getElementById(
        "cat-categorie-count",
    ) as HTMLElement;
    feedbackEl = document.getElementById("cat-feedback") as HTMLElement;

    // Search filters
    familleSearch.addEventListener("input", () => {
        familleFilter = familleSearch.value;
        renderFamilles();
    });
    categorieSearch.addEventListener("input", () => {
        categorieFilter = categorieSearch.value;
        renderCategories();
    });

    // Create buttons
    document
        .getElementById("cat-famille-create")!
        .addEventListener("click", openCreateFamilleModal);
    document
        .getElementById("cat-categorie-create")!
        .addEventListener("click", openCreateCategorieModal);

    // Initial load
    reloadAll().catch((err) => {
        showFeedback("Erreur lors du chargement du catalogue.", true);
        console.error("[Catalogue]", err);
    });

    // Return focus function for tab manager
    return () => familleSearch.focus();
}
