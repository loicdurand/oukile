import { createMouvementTab } from './mouvement';

export const initSortir = (): (() => void) => createMouvementTab('sortir');
