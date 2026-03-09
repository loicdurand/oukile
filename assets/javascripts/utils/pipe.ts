export function pipe(...fns: Function[]) {
    return function (x: any) {
        return fns.reduce((v, f) => f(v), x)
    }
}