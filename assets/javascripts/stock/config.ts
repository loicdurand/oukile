const login = document.getElementById("login");
let unite_id = 0;
if (login !== null) {
    const { dataset } = login;
    unite_id = +(dataset.unite || 0);
}
export const UNITE_ID = unite_id;
export const API_BASE = "/oukile/api";
export const SEARCH_DEBOUNCE_MS = 300;
