export const pTargets = new WeakMap<object, object>()

globalThis.Proxy = new Proxy(globalThis.Proxy, {
    construct(target, args) {
        const prox = Reflect.construct(target, args)
        pTargets.set(prox, args[0])
        return prox
    },
})
