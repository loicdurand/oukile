export async function onReady(selector: string) {
  while (document.querySelector(selector) === null)
    await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector(selector);
}

export function getParent(
  element_or_selector: HTMLElement | string,
  selector: string,
): HTMLElement | null {
  let element: HTMLElement | null = null;

  // Si l'élément est une chaîne de caractères, on l'convertit en élément
  if (typeof element_or_selector === "string")
    element = document.querySelector(element_or_selector);

  // Si l'élément n'est pas une instance d'HTMLElement ou si l'élément n'a pas de parent, on retourne null
  if (
    typeof element !== "object" ||
    !element ||
    !selector ||
    element.matches(selector) ||
    !element.parentElement
  )
    return null;

  let parent = element.parentElement;
  while (parent) {
    if (parent.matches(selector)) return parent;
    if (!parent.parentElement) return null;
    parent = parent.parentElement;
  }
  return null;
}
