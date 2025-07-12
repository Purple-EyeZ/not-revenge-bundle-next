import { instead } from '@revenge-mod/patcher'
import { ReactJSXRuntime } from '..'
import { jPatches } from './_internal'
import type { ReactElement } from 'react'
import type { AnyJSXFactoryFunction } from '.'

const jsx = ReactJSXRuntime.jsx

const patch = (
    args: Parameters<AnyJSXFactoryFunction>,
    orig: AnyJSXFactoryFunction,
) => {
    const [type] = args
    const patches = jPatches.get(type)
    if (!patches) return Reflect.apply(orig, ReactJSXRuntime, args)

    const [before, after, instead] = patches

    if (before) for (const cb of before) args = cb(args)

    let fiber: ReactElement | null | undefined

    // If there are instead patches, fiber will always be set by the instead patches
    if (instead) for (const cb of instead) fiber = cb(args, jsx)
    // If there aren't any instead patches, we compute the fiber normally, and it will be set
    else fiber = Reflect.apply(orig, ReactJSXRuntime, args)

    if (after) for (const cb of after) fiber = cb(fiber!)

    return fiber!
}

instead(ReactJSXRuntime, 'jsx', patch)
instead(ReactJSXRuntime, 'jsxs', patch)
