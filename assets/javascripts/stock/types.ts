export interface ApiCollection<T> {
    member: T[];
    totalItems: number;
    "hydra:view"?: {
        "@id": string;
        "hydra:next"?: string;
    };
}

export interface Categorie {
    "@id": string;
    id: number;
    nom: string;
}

export interface FamilleArticle {
    "@id": string;
    id: number;
    marque: string | null;
    modele: string | null;
    description: string | null;
    categorie: Categorie;
}

export interface Piece {
    "@id": string;
    id: number;
    nom: string;
}

/**
 * Zone as returned by zone:read group.
 * `piece` is embedded (Piece fields carry zone:read group).
 */
export interface Zone {
    "@id": string;
    id: number;
    nom: string;
    piece: Piece | string;
}

/**
 * Rangement as returned by rangement:read group.
 * `zone` is an IRI string (Zone fields do not carry rangement:read).
 */
export interface Rangement {
    "@id": string;
    id: number;
    nom: string;
    zone: string;
}

/**
 * Emplacement as returned by emplacement:read group.
 * `rangement` is an IRI string (Rangement fields do not carry emplacement:read).
 */
export interface Emplacement {
    "@id": string;
    id: number;
    nom: string;
    rangement: string;
}

/**
 * Lot as returned by lot:read group.
 * `famille` is embedded (FamilleArticle fields carry lot:read group).
 * `emplacement` is an IRI string (Emplacement fields do not carry lot:read).
 */
export interface Lot {
    "@id": string;
    id: number;
    nombre: number;
    famille: FamilleArticle;
    emplacement: string;
}

export interface LocationPath {
    piece: Piece;
    zone: Zone;
    rangement: Rangement;
    emplacement: Emplacement;
}
