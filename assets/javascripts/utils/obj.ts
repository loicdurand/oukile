export function buildTree(objs: any[], id_field: string = 'id', parent_field: string = 'parent') {
    // Créer une map par ID (paramètre id_field) pour éviter de chercher dans le tableau à chaque fois
    const entryMap: any = {};
    objs.forEach((entry: any) => {
        entryMap[entry[id_field]] = { ...entry, children: [] }; // Copie l'objet et ajoute un tableau enfants vide
    });

    const roots: any[] = []; // Les entrées sans parent

    objs.forEach(entry => {
        const mappedUnit = entryMap[entry[id_field]];
        if (entry[parent_field]) {
            // Si y a un parent, on l'ajoute comme enfant du parent
            if (entryMap[entry[parent_field]]) {
                entryMap[entry[parent_field]].children.push(mappedUnit);
            } else {
                console.warn(`Parent ${entry[parent_field]} non trouvé pour l'entrée ${entry[id_field]}`);
            }
        } else {
            // Sinon, c'est une racine
            roots.push(mappedUnit);
        }
    });

    return roots.length ? roots : objs;
}

export function serialize(obj: any) {
    var str = [];
    for (var p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
}