export async function onReady(selector: string) {
    while (document.querySelector(selector) === null)
        await new Promise(resolve => requestAnimationFrame(resolve));
    return document.querySelector(selector);
}

export function getParent(elt: HTMLElement, match: string) {
    while (!elt.matches(match) && elt.parentElement !== null) {
        elt = elt.parentElement;
    }
    if (elt.nodeName == 'BODY')
        return false;
    return elt;
}