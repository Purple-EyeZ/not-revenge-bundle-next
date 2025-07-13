export function debounce<F extends (...args: any[]) => any>(
    func: F,
    timeout: number,
) {
    let timer: Parameters<typeof clearTimeout>[0]
    return (...args: Parameters<F>) =>
        new Promise(rs => {
            clearTimeout(timer)
            timer = setTimeout(() => {
                rs(func(...args))
            }, timeout)
        })
}

export const noop = () => {}
