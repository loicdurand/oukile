export function sansAccent(str: string): string {

    str ||= '';

    const // 
        accents = [
            /[\xC0-\xC6]/g, /[\xE0-\xE6]/g, // A, a
            /[\xC8-\xCB]/g, /[\xE8-\xEB]/g, // E, e
            /[\xCC-\xCF]/g, /[\xEC-\xEF]/g, // I, i
            /[\xD2-\xD8]/g, /[\xF2-\xF8]/g, // O, o
            /[\xD9-\xDC]/g, /[\xF9-\xFC]/g, // U, u
            /[\xD1]/g, /[\xF1]/g, // N, n
            /[\xC7]/g, /[\xE7]/g, // C, c
        ]
        , noaccent = ['A', 'a', 'E', 'e', 'I', 'i', 'O', 'o', 'U', 'u', 'N', 'n', 'C', 'c'];

    for (var i = 0; i < accents.length; i++)
        str = str.replace(accents[i], noaccent[i]);

    return str;
}

export function normalizeAccents(text: string) {
    const accentsMap = {
        'àáâäãåâ': 'aaaaaâ',
        'èéêë': 'eeee',
        'ìíîï': 'iiii',
        'òóôöõø': 'ooooo',
        'ùúûü': 'uuuu',
        'ç': 'c',
        'ñ': 'n',
        // Majuscules
        'ÀÁÂÄÃÅ': 'AAAAA',
        'ÈÉÊË': 'EEEE',
        'ÌÍÎÏ': 'IIII',
        'ÒÓÔÖÕØ': 'OOOOO',
        'ÙÚÛÜ': 'UUUU',
        'Ç': 'C',
        'Ñ': 'N',
    };
    let normalized = text;
    for (const [accents, plain] of Object.entries(accentsMap)) {
        const regex = new RegExp(`[${accents}]`, 'g');
        normalized = normalized.replace(regex, (match: string) => plain[accents.indexOf(match)]);
    }
    return normalized.toLowerCase(); // Pour matcher le lexique en minuscules
}

export function addZeros(str: string, maxlen = 2) {
    str = '' + str;
    while (str.length < maxlen)
        str = "0" + str;
    return str;
}

export function pluralize(nb: number, sing: string = '', plur: string = '') {
    return (isNaN(nb) || +nb > 1) ? plur || (sing + 's') : sing;
}

export function truncate(str: string, n = 15, useWordBoundary = false) {
    if (str.length <= n) { return str; }
    const subString = str.slice(0, n - 1); // the original check
    return (useWordBoundary ? subString.slice(0, subString.lastIndexOf(" ")) : subString) + "...";
}