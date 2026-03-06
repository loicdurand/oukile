import { loadPieces, loadZones, loadRangements, loadEmplacements } from './api';
import type { Piece, Zone, Rangement, Emplacement, LocationPath } from './types';

// ── State ───────────────────────────────────────────────────────────────────

let pieces: Piece[] = [];
let zones: Zone[] = [];
let rangements: Rangement[] = [];
let emplacements: Emplacement[] = [];

const pieceByIri = new Map<string, Piece>();
const zoneByIri = new Map<string, Zone>();
const rangementByIri = new Map<string, Rangement>();
const emplacementByIri = new Map<string, Emplacement>();

// ── Helpers ─────────────────────────────────────────────────────────────────

function iriOf(ref: string | { '@id': string }): string {
    return typeof ref === 'string' ? ref : ref['@id'];
}

// ── Init ─────────────────────────────────────────────────────────────────────

export async function initStore(): Promise<void> {
    [pieces, zones, rangements, emplacements] = await Promise.all([
        loadPieces(),
        loadZones(),
        loadRangements(),
        loadEmplacements(),
    ]);

    pieces.forEach((p) => pieceByIri.set(p['@id'], p));
    zones.forEach((z) => zoneByIri.set(z['@id'], z));
    rangements.forEach((r) => rangementByIri.set(r['@id'], r));
    emplacements.forEach((e) => emplacementByIri.set(e['@id'], e));
}

// ── Accessors ────────────────────────────────────────────────────────────────

export function getPieces(): Piece[] {
    return pieces;
}

export function getZonesForPiece(pieceIri: string): Zone[] {
    return zones.filter((z) => iriOf(z.piece) === pieceIri);
}

export function getRangementsForZone(zoneIri: string): Rangement[] {
    return rangements.filter((r) => r.zone === zoneIri);
}

export function getEmplacementsForRangement(rangementIri: string): Emplacement[] {
    return emplacements.filter((e) => e.rangement === rangementIri);
}

/**
 * Resolves the full location path (piece > zone > rangement > emplacement)
 * for a given emplacement IRI using the preloaded lookup maps.
 */
export function resolveLocation(emplacementIri: string): LocationPath | null {
    const emplacement = emplacementByIri.get(emplacementIri);
    if (!emplacement) return null;

    const rangement = rangementByIri.get(emplacement.rangement);
    if (!rangement) return null;

    const zone = zoneByIri.get(rangement.zone);
    if (!zone) return null;

    const pieceIri = iriOf(zone.piece);
    const piece = pieceByIri.get(pieceIri);
    if (!piece) return null;

    return { piece, zone, rangement, emplacement };
}
