import {
    searchCategoriesInCatalogue,
    createCategorie,
    patchCategorie,
    deleteCategorie,
    searchFamillesInCatalogue,
    createFamille,
    patchFamille,
    deleteFamille,
} from "../api";
import { UNITE_ID, SEARCH_DEBOUNCE_MS } from "../config";
import type { Categorie, FamilleArticle } from "../types";

// ── State ─────────────────────────────────────────────────────────────────

let categories: Categorie[] = [];

// Famille search state
let familleCurrentPage = 1;
let familleTotalItems = 0;
const FAMILLE_PAGE_SIZE = 30;
let familleCurrentResults: FamilleArticle[] = [];
let familleDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let familleOnlyInUnite = true;

// Categorie search state
let categorieCurrentPage = 1;
let categorieTotalItems = 0;
const CATEGORIE_PAGE_SIZE = 30;
let categorieCurrentResults: Categorie[] = [];
let categorieDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// ── DOM refs (set in init) ─────────────────────────────────────────────────

let familleTableBody: HTMLTableSectionElement;
let categorieTableBody: HTMLTableSectionElement;
let familleSearch: HTMLInputElement;
let familleUniteToggle: HTMLInputElement;
let categorieSearch: HTMLInputElement;
let familleCount: HTMLElement;
let categorieCount: HTMLElement;
let famillePagination: HTMLElement;
let categoriePagination: HTMLElement;
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
        confirmBtn: root.querySelector(
            "#cat-modal-confirm",
        ) as HTMLButtonElement,
        cancelBtn: root.querySelector("#cat-modal-cancel") as HTMLButtonElement,
    };
}

function openConfirmModal(
    message: string,
    onConfirm: () => Promise<void>,
): void {
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
    const fieldsHtml = opts.fields
        .map((f) => {
            if (f.type === "select") {
                const optionsHtml = (f.options ?? [])
                    .map(
                        (o) => `<option value="${o.value}">${o.label}</option>`,
                    )
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
        })
        .join("");

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
    const submitBtn = root.querySelector(
        "#cat-form-submit",
    ) as HTMLButtonElement;
    const cancelBtn = root.querySelector(
        "#cat-form-cancel",
    ) as HTMLButtonElement;
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
        const missing = opts.fields.filter((f) => f.required && !values[f.id]);
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
    (
        root.querySelector(
            ".cat__form-input, .cat__form-select",
        ) as HTMLElement | null
    )?.focus();
}

// ── Famille rendering ──────────────────────────────────────────────────────

function renderFamilleRows(familles: FamilleArticle[]): void {
    familleTableBody.innerHTML = "";

    if (familles.length === 0) {
        const query = familleSearch.value.trim();
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="4" class="cat__empty">${
            query.length < 2
                ? "Saisissez au moins 2 caractères pour rechercher."
                : "Aucun article trouvé."
        }</td>`;
        familleTableBody.appendChild(tr);
        return;
    }

    for (const f of familles) {
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

function renderFamillePagination(): void {
    famillePagination.innerHTML = "";
    const totalPages = Math.ceil(familleTotalItems / FAMILLE_PAGE_SIZE);
    if (totalPages <= 1) return;

    const nav = document.createElement("nav");
    nav.className = "cat__pagination";
    nav.setAttribute("aria-label", "Pagination des articles");

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "cat__page-btn";
    prevBtn.textContent = "‹ Préc.";
    prevBtn.disabled = familleCurrentPage <= 1;
    prevBtn.addEventListener("click", () => {
        if (familleCurrentPage > 1) runFamilleSearch(familleCurrentPage - 1);
    });

    const pageInfo = document.createElement("span");
    pageInfo.className = "cat__page-info";
    pageInfo.textContent = `Page ${familleCurrentPage} / ${totalPages}`;

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "cat__page-btn";
    nextBtn.textContent = "Suiv. ›";
    nextBtn.disabled = familleCurrentPage >= totalPages;
    nextBtn.addEventListener("click", () => {
        if (familleCurrentPage < totalPages)
            runFamilleSearch(familleCurrentPage + 1);
    });

    nav.appendChild(prevBtn);
    nav.appendChild(pageInfo);
    nav.appendChild(nextBtn);
    famillePagination.appendChild(nav);
}

function renderCategorieRows(cats: Categorie[]): void {
    categorieTableBody.innerHTML = "";

    if (cats.length === 0) {
        const query = categorieSearch.value.trim();
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="3" class="cat__empty">${
            query.length < 2
                ? "Saisissez au moins 2 caractères pour rechercher."
                : "Aucune catégorie trouvée."
        }</td>`;
        categorieTableBody.appendChild(tr);
        return;
    }

    for (const c of cats) {
        const tr = document.createElement("tr");
        tr.className = "cat__row";
        tr.innerHTML = `
            <td class="cat__cell cat__cell--main">${c.nom}</td>
            <td class="cat__cell cat__cell--actions">
                <button class="cat__action-btn cat__action-btn--edit" data-id="${c.id}" title="Modifier" aria-label="Modifier ${c.nom}">
                    <span aria-hidden="true">✏️</span>
                </button>
                <button class="cat__action-btn cat__action-btn--delete" data-id="${c.id}" title="Supprimer" aria-label="Supprimer ${c.nom}">
                    <span aria-hidden="true">🗑️</span>
                </button>
            </td>
        `;

        tr.querySelector(".cat__action-btn--edit")!.addEventListener(
            "click",
            () => openEditCategorieModal(c),
        );
        tr.querySelector(".cat__action-btn--delete")!.addEventListener(
            "click",
            () => confirmDeleteCategorie(c),
        );

        categorieTableBody.appendChild(tr);
    }
}

function renderCategoriePagination(): void {
    categoriePagination.innerHTML = "";
    const totalPages = Math.ceil(categorieTotalItems / CATEGORIE_PAGE_SIZE);
    if (totalPages <= 1) return;

    const nav = document.createElement("nav");
    nav.className = "cat__pagination";
    nav.setAttribute("aria-label", "Pagination des catégories");

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "cat__page-btn";
    prevBtn.textContent = "‹ Préc.";
    prevBtn.disabled = categorieCurrentPage <= 1;
    prevBtn.addEventListener("click", () => {
        if (categorieCurrentPage > 1)
            runCategorieSearch(categorieCurrentPage - 1);
    });

    const pageInfo = document.createElement("span");
    pageInfo.className = "cat__page-info";
    pageInfo.textContent = `Page ${categorieCurrentPage} / ${totalPages}`;

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "cat__page-btn";
    nextBtn.textContent = "Suiv. ›";
    nextBtn.disabled = categorieCurrentPage >= totalPages;
    nextBtn.addEventListener("click", () => {
        if (categorieCurrentPage < totalPages)
            runCategorieSearch(categorieCurrentPage + 1);
    });

    nav.appendChild(prevBtn);
    nav.appendChild(pageInfo);
    nav.appendChild(nextBtn);
    categoriePagination.appendChild(nav);
}

// ── Famille server search ──────────────────────────────────────────────────

// ── Categorie server search ────────────────────────────────────────────────

async function runCategorieSearch(page = 1): Promise<void> {
    const query = categorieSearch.value.trim();

    if (query.length < 2) {
        categorieCurrentResults = [];
        categorieTotalItems = 0;
        categorieCurrentPage = 1;
        categorieCount.textContent = "";
        renderCategorieRows([]);
        categoriePagination.innerHTML = "";
        return;
    }

    categorieTableBody.innerHTML = `<tr><td colspan="3" class="cat__empty cat__empty--loading">
        <span class="qs__spinner" aria-hidden="true"></span> Recherche…
    </td></tr>`;

    try {
        const result = await searchCategoriesInCatalogue(
            query,
            page,
            CATEGORIE_PAGE_SIZE,
        );
        categorieCurrentResults = result.items;
        categorieTotalItems = result.total;
        categorieCurrentPage = page;

        const total = result.total;
        categorieCount.textContent =
            total === 0
                ? "Aucun résultat"
                : `${total} catégorie${total > 1 ? "s" : ""}`;

        renderCategorieRows(categorieCurrentResults);
        renderCategoriePagination();
    } catch (err) {
        categorieTableBody.innerHTML = `<tr><td colspan="3" class="cat__empty cat__error">Erreur lors de la recherche.</td></tr>`;
        console.error("[Catalogue/categories]", err);
    }
}

function scheduleCategorieSearch(): void {
    if (categorieDebounceTimer !== null) clearTimeout(categorieDebounceTimer);
    categorieDebounceTimer = setTimeout(
        () => runCategorieSearch(1),
        SEARCH_DEBOUNCE_MS,
    );
}

async function runFamilleSearch(page = 1): Promise<void> {
    const query = familleSearch.value.trim();

    if (query.length < 2) {
        familleCurrentResults = [];
        familleTotalItems = 0;
        familleCurrentPage = 1;
        familleCount.textContent = "";
        renderFamilleRows([]);
        famillePagination.innerHTML = "";
        return;
    }

    familleTableBody.innerHTML = `<tr><td colspan="4" class="cat__empty cat__empty--loading">
        <span class="qs__spinner" aria-hidden="true"></span> Recherche…
    </td></tr>`;

    try {
        const result = await searchFamillesInCatalogue(
            query,
            page,
            FAMILLE_PAGE_SIZE,
            familleOnlyInUnite ? UNITE_ID : null,
        );
        familleCurrentResults = result.items;
        familleTotalItems = result.total;
        familleCurrentPage = page;

        const total = result.total;
        familleCount.textContent =
            total === 0
                ? "Aucun résultat"
                : `${total} article${total > 1 ? "s" : ""}`;

        renderFamilleRows(familleCurrentResults);
        renderFamillePagination();
    } catch (err) {
        familleTableBody.innerHTML = `<tr><td colspan="4" class="cat__empty cat__error">Erreur lors de la recherche.</td></tr>`;
        console.error("[Catalogue/familles]", err);
    }
}

function scheduleFamilleSearch(): void {
    if (familleDebounceTimer !== null) clearTimeout(familleDebounceTimer);
    familleDebounceTimer = setTimeout(
        () => runFamilleSearch(1),
        SEARCH_DEBOUNCE_MS,
    );
}

// ── Reload helpers ─────────────────────────────────────────────────────────

async function reloadAfterFamilleWrite(): Promise<void> {
    await runFamilleSearch(familleCurrentPage);
}

async function reloadAfterCategorieWrite(): Promise<void> {
    await runCategorieSearch(categorieCurrentPage);
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
            await reloadAfterFamilleWrite();
            showFeedback("Article créé avec succès.");
        },
    });
}

function openEditFamilleModal(f: FamilleArticle): void {
    const label =
        [f.marque, f.modele].filter(Boolean).join(" ") ||
        f.description ||
        "cet article";

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
            await reloadAfterFamilleWrite();
            showFeedback("Article modifié avec succès.");
        },
    });
}

function confirmDeleteFamille(f: FamilleArticle): void {
    const label =
        [f.marque, f.modele].filter(Boolean).join(" ") ||
        f.description ||
        "cet article";

    openConfirmModal(
        `Supprimer définitivement « ${label} » ? Cette action est irréversible.`,
        async () => {
            await deleteFamille(f.id);
            await reloadAfterFamilleWrite();
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
            await reloadAfterCategorieWrite();
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
            await reloadAfterCategorieWrite();
            showFeedback("Catégorie modifiée avec succès.");
        },
    });
}

function confirmDeleteCategorie(c: Categorie): void {
    openConfirmModal(
        `Supprimer la catégorie « ${c.nom} » ? Cette action est irréversible.`,
        async () => {
            await deleteCategorie(c.id);
            await reloadAfterCategorieWrite();
            showFeedback("Catégorie supprimée.");
        },
    );
}

// ── Init ──────────────────────────────────────────────────────────────────

export function initCatalogue(): { focus: () => void; reset: () => void } {
    familleTableBody = document.getElementById(
        "cat-famille-tbody",
    ) as HTMLTableSectionElement;
    categorieTableBody = document.getElementById(
        "cat-categorie-tbody",
    ) as HTMLTableSectionElement;
    familleSearch = document.getElementById(
        "cat-famille-search",
    ) as HTMLInputElement;
    familleUniteToggle = document.getElementById(
        "cat-famille-unite-toggle",
    ) as HTMLInputElement;
    categorieSearch = document.getElementById(
        "cat-categorie-search",
    ) as HTMLInputElement;
    familleCount = document.getElementById("cat-famille-count") as HTMLElement;
    categorieCount = document.getElementById(
        "cat-categorie-count",
    ) as HTMLElement;
    famillePagination = document.getElementById(
        "cat-famille-pagination",
    ) as HTMLElement;
    categoriePagination = document.getElementById(
        "cat-categorie-pagination",
    ) as HTMLElement;
    feedbackEl = document.getElementById("cat-feedback") as HTMLElement;

    // Famille: debounced server search
    familleSearch.addEventListener("input", scheduleFamilleSearch);

    // Famille: unite filter toggle
    familleOnlyInUnite = familleUniteToggle.checked;
    familleUniteToggle.addEventListener("change", () => {
        familleOnlyInUnite = familleUniteToggle.checked;
        runFamilleSearch(1);
    });

    // Categorie: debounced server search
    categorieSearch.addEventListener("input", scheduleCategorieSearch);

    // Create buttons
    document
        .getElementById("cat-famille-create")!
        .addEventListener("click", openCreateFamilleModal);
    document
        .getElementById("cat-categorie-create")!
        .addEventListener("click", openCreateCategorieModal);

    // Show initial empty state for both tables
    renderFamilleRows([]);
    renderCategorieRows([]);

    // Return focus+reset for tab manager
    function reset(): void {
        familleSearch.value = "";
        familleCurrentResults = [];
        familleTotalItems = 0;
        familleCurrentPage = 1;
        familleCount.textContent = "";
        famillePagination.innerHTML = "";
        renderFamilleRows([]);

        categorieSearch.value = "";
        categorieCurrentResults = [];
        categorieTotalItems = 0;
        categorieCurrentPage = 1;
        categorieCount.textContent = "";
        categoriePagination.innerHTML = "";
        renderCategorieRows([]);
    }

    return { focus: () => familleSearch.focus(), reset };
}
