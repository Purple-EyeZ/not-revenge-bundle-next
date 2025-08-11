import type { Metro } from '@revenge-mod/modules/types'

Object.defineProperty(globalThis, '__c', {
    configurable: true,
    set(clear: Metro.ClearFn) {
        // @ts-expect-error
        // biome-ignore lint/performance/noDelete: Prevent infinite set loop
        delete globalThis.__c
        globalThis.__c = clear

        require('./preinit')
    },
})
