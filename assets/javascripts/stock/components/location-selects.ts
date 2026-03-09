import { getPieces, getZonesForPiece, getRangementsForZone, getEmplacementsForRangement } from '../store';
import type { Piece, Zone, Rangement, Emplacement } from '../types';

export interface LocationSelection {
    piece: Piece | null;
    zone: Zone | null;
    rangement: Rangement | null;
    emplacement: Emplacement | null;
}

type ChangeCallback = (selection: LocationSelection) => void;

function populateSelect<T extends { '@id': string; nom: string }>(
    select: HTMLSelectElement,
    items: T[],
): void {
    select.innerHTML = '<option value="">— Choisir —</option>';
    items.forEach((item) => {
        const opt = document.createElement('option');
        opt.value = item['@id'];
        opt.textContent = item.nom;
        select.appendChild(opt);
    });
    select.disabled = items.length === 0;
}

function resetSelect(select: HTMLSelectElement): void {
    select.innerHTML = '<option value="">— Choisir —</option>';
    select.disabled = true;
}

/**
 * Manages the four cascading location selects (pièce › zone › rangement › emplacement).
 * All filtering is done client-side against the preloaded store.
 */
export class LocationSelects {
    private readonly pieceEl: HTMLSelectElement;
    private readonly zoneEl: HTMLSelectElement;
    private readonly rangementEl: HTMLSelectElement;
    private readonly emplacementEl: HTMLSelectElement;
    private readonly onChange: ChangeCallback;

    private zones: Zone[] = [];
    private rangements: Rangement[] = [];
    private emplacements: Emplacement[] = [];

    private selection: LocationSelection = {
        piece: null,
        zone: null,
        rangement: null,
        emplacement: null,
    };

    constructor(
        pieceEl: HTMLSelectElement,
        zoneEl: HTMLSelectElement,
        rangementEl: HTMLSelectElement,
        emplacementEl: HTMLSelectElement,
        onChange: ChangeCallback,
    ) {
        this.pieceEl = pieceEl;
        this.zoneEl = zoneEl;
        this.rangementEl = rangementEl;
        this.emplacementEl = emplacementEl;
        this.onChange = onChange;

        this.pieceEl.addEventListener('change', this.onPieceChange.bind(this));
        this.zoneEl.addEventListener('change', this.onZoneChange.bind(this));
        this.rangementEl.addEventListener('change', this.onRangementChange.bind(this));
        this.emplacementEl.addEventListener('change', this.onEmplacementChange.bind(this));

        this.populatePieces();
    }

    // ── Handlers ──────────────────────────────────────────────────────────────

    private populatePieces(): void {
        populateSelect(this.pieceEl, getPieces());
        this.pieceEl.disabled = false;
        resetSelect(this.zoneEl);
        resetSelect(this.rangementEl);
        resetSelect(this.emplacementEl);
    }

    private onPieceChange(): void {
        const iri = this.pieceEl.value;
        this.selection.piece = getPieces().find((p) => p['@id'] === iri) ?? null;
        this.selection.zone = null;
        this.selection.rangement = null;
        this.selection.emplacement = null;

        resetSelect(this.zoneEl);
        resetSelect(this.rangementEl);
        resetSelect(this.emplacementEl);

        if (this.selection.piece) {
            this.zones = getZonesForPiece(iri);
            populateSelect(this.zoneEl, this.zones);
        }

        this.onChange(this.selection);
    }

    private onZoneChange(): void {
        const iri = this.zoneEl.value;
        this.selection.zone = this.zones.find((z) => z['@id'] === iri) ?? null;
        this.selection.rangement = null;
        this.selection.emplacement = null;

        resetSelect(this.rangementEl);
        resetSelect(this.emplacementEl);

        if (this.selection.zone) {
            this.rangements = getRangementsForZone(iri);
            populateSelect(this.rangementEl, this.rangements);
        }

        this.onChange(this.selection);
    }

    private onRangementChange(): void {
        const iri = this.rangementEl.value;
        this.selection.rangement = this.rangements.find((r) => r['@id'] === iri) ?? null;
        this.selection.emplacement = null;

        resetSelect(this.emplacementEl);

        if (this.selection.rangement) {
            this.emplacements = getEmplacementsForRangement(iri);
            populateSelect(this.emplacementEl, this.emplacements);
        }

        this.onChange(this.selection);
    }

    private onEmplacementChange(): void {
        const iri = this.emplacementEl.value;
        this.selection.emplacement = this.emplacements.find((e) => e['@id'] === iri) ?? null;
        this.onChange(this.selection);
    }

    // ── Public ────────────────────────────────────────────────────────────────

    reset(): void {
        this.pieceEl.value = '';
        this.selection = { piece: null, zone: null, rangement: null, emplacement: null };
        this.zones = [];
        this.rangements = [];
        this.emplacements = [];
        resetSelect(this.zoneEl);
        resetSelect(this.rangementEl);
        resetSelect(this.emplacementEl);
        this.onChange(this.selection);
    }
}
