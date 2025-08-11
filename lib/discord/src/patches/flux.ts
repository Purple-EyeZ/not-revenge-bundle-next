import { Dispatcher } from '../common/flux'
import type { FluxEventDispatchPatch } from '../flux/dispatcher'

export const fPatchesAll: Set<FluxEventDispatchPatch<any>> = new Set()
export const fPatches: Map<string, Set<FluxEventDispatchPatch<any>>> = new Map()

const originalDispatch = Dispatcher.dispatch
Dispatcher.dispatch = payload => {
    let res: typeof payload | undefined | void = payload

    for (const patch of fPatchesAll)
        try {
            res = patch(res!)
            if (!res) break
        } catch {}

    if (res) {
        const specifics = fPatches.get(payload.type)
        if (specifics?.size)
            for (const patch of specifics)
                try {
                    res = patch(res!)
                    if (!res) break
                } catch {}
    }

    if (res) return Reflect.apply(originalDispatch, Dispatcher, [res])
    // If res is undefined, the event is blocked
    return Promise.resolve()
}
