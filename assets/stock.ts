import './styles/stock.scss';
import { initApp } from './javascripts/stock/app';

document.addEventListener('DOMContentLoaded', () => {
    initApp().catch((err) => console.error('[QuickStock]', err));
});
