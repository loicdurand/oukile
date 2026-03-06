import { API_BASE, UNITE_ID } from "./config";
import type {
    ApiCollection,
    Categorie,
    FamilleArticle,
    Piece,
    Zone,
    Rangement,
    Emplacement,
    Lot,
} from "./types";

// ── HTTP helpers ────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url, {
        headers: { Accept: "application/ld+json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.json() as Promise<T>;
}

/**
 * Fetches all pages of a paginated collection, following hydra:next links.
 */
async function fetchAll<T>(baseUrl: string): Promise<T[]> {
    const results: T[] = [];
    const separator = baseUrl.includes("?") ? "&" : "?";
    let nextUrl: string | undefined = `${baseUrl}${separator}itemsPerPage=100`;

    while (nextUrl) {
        const data: any = await fetchJson<ApiCollection<T>>(nextUrl);
        results.push(...data["member"]);
        nextUrl = data["hydra:view"]?.["hydra:next"];
    }

    return results;
}

// ── Categorie ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Categorie[]> {
    return fetchAll<Categorie>(`${API_BASE}/categories`);
}

export async function createCategorie(nom: string): Promise<Categorie> {
    const res = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: {
            "Content-Type": "application/ld+json",
            Accept: "application/ld+json",
        },
        body: JSON.stringify({ nom }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<Categorie>;
}

export async function patchCategorie(
    id: number,
    nom: string,
): Promise<Categorie> {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/merge-patch+json",
            Accept: "application/ld+json",
        },
        body: JSON.stringify({ nom }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<Categorie>;
}

export async function deleteCategorie(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/ld+json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// ── FamilleArticle ──────────────────────────────────────────────────────────

export async function getFamilles(): Promise<FamilleArticle[]> {
    return fetchAll<FamilleArticle>(`${API_BASE}/famille_articles`);
}

export async function createFamille(payload: {
    categorieIri: string;
    marque: string | null;
    modele: string | null;
    description: string | null;
}): Promise<FamilleArticle> {
    const res = await fetch(`${API_BASE}/famille_articles`, {
        method: "POST",
        headers: {
            "Content-Type": "application/ld+json",
            Accept: "application/ld+json",
        },
        body: JSON.stringify({
            categorie: payload.categorieIri,
            marque: payload.marque || null,
            modele: payload.modele || null,
            description: payload.description || null,
        }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<FamilleArticle>;
}

export async function patchFamille(
    id: number,
    payload: {
        categorieIri?: string;
        marque?: string | null;
        modele?: string | null;
        description?: string | null;
    },
): Promise<FamilleArticle> {
    const body: Record<string, unknown> = {};
    if (payload.categorieIri !== undefined)
        body["categorie"] = payload.categorieIri;
    if (payload.marque !== undefined) body["marque"] = payload.marque || null;
    if (payload.modele !== undefined) body["modele"] = payload.modele || null;
    if (payload.description !== undefined)
        body["description"] = payload.description || null;

    const res = await fetch(`${API_BASE}/famille_articles/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/merge-patch+json",
            Accept: "application/ld+json",
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<FamilleArticle>;
}

export async function deleteFamille(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/famille_articles/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/ld+json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/**
 * Searches famille_articles across marque, modele and description fields (OR).
 * Requires SearchFilter on those three fields (partial strategy) in the API.
 * Results are deduplicated by id.
 */
export async function searchFamilles(query: string): Promise<FamilleArticle[]> {
    const q = encodeURIComponent(query);

    const [byMarque, byModele, byDesc] = await Promise.all([
        fetchJson<ApiCollection<FamilleArticle>>(
            `${API_BASE}/famille_articles?marque=${q}&itemsPerPage=20`,
        ),
        fetchJson<ApiCollection<FamilleArticle>>(
            `${API_BASE}/famille_articles?modele=${q}&itemsPerPage=20`,
        ),
        fetchJson<ApiCollection<FamilleArticle>>(
            `${API_BASE}/famille_articles?description=${q}&itemsPerPage=20`,
        ),
    ]);

    const seen = new Set<number>();

    return [
        ...byMarque["member"],
        ...byModele["member"],
        ...byDesc["member"],
    ].filter((f) => {
        if (seen.has(f.id)) return false;
        seen.add(f.id);
        return true;
    });
}

// ── Lots ────────────────────────────────────────────────────────────────────

/**
 * Returns all lots for a given famille scoped to the configured unite.
 * Requires SearchFilter on famille.id and emplacement.rangement.zone.piece.unite.id.
 */
export async function getLotsForFamille(familleId: number): Promise<Lot[]> {
    return fetchAll<Lot>(
        `${API_BASE}/lots?famille.id=${familleId}&emplacement.rangement.zone.piece.unite.id=${UNITE_ID}`,
    );
}

/**
 * Finds an existing lot for the given famille + emplacement pair.
 * Returns null when none exists.
 * Requires SearchFilter on famille.id and emplacement.id.
 */
export async function findLot(
    familleId: number,
    emplacementId: number,
): Promise<Lot | null> {
    const data = await fetchJson<ApiCollection<Lot>>(
        `${API_BASE}/lots?famille.id=${familleId}&emplacement.id=${emplacementId}&itemsPerPage=1`,
    );
    return data["member"][0] ?? null;
}

export async function createLot(
    familleIri: string,
    emplacementIri: string,
    nombre: number,
): Promise<Lot> {
    const res = await fetch(`${API_BASE}/lots`, {
        method: "POST",
        headers: {
            "Content-Type": "application/ld+json",
            Accept: "application/ld+json",
        },
        body: JSON.stringify({
            famille: familleIri,
            emplacement: emplacementIri,
            nombre,
        }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<Lot>;
}

export async function patchLot(lotId: number, nombre: number): Promise<Lot> {
    const res = await fetch(`${API_BASE}/lots/${lotId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/merge-patch+json",
            Accept: "application/ld+json",
        },
        body: JSON.stringify({ nombre }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<Lot>;
}

// ── Location data ───────────────────────────────────────────────────────────

/**
 * Requires SearchFilter on unite.id.
 */
export async function loadPieces(): Promise<Piece[]> {
    return fetchAll<Piece>(`${API_BASE}/pieces?unite.id=${UNITE_ID}`);
}

/**
 * Requires SearchFilter on piece.unite.id.
 */
export async function loadZones(): Promise<Zone[]> {
    return fetchAll<Zone>(`${API_BASE}/zones?piece.unite.id=${UNITE_ID}`);
}

/**
 * Requires SearchFilter on zone.piece.unite.id.
 */
export async function loadRangements(): Promise<Rangement[]> {
    return fetchAll<Rangement>(
        `${API_BASE}/rangements?zone.piece.unite.id=${UNITE_ID}`,
    );
}

/**
 * Requires SearchFilter on rangement.zone.piece.unite.id.
 */
export async function loadEmplacements(): Promise<Emplacement[]> {
    return fetchAll<Emplacement>(
        `${API_BASE}/emplacements?rangement.zone.piece.unite.id=${UNITE_ID}`,
    );
}
