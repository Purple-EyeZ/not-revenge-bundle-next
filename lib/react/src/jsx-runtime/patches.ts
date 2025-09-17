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

    const { before, after, instead } = patches

    if (before) for (const cb of before) args = cb(args)

    let el: ReactElement | null | undefined

    // If there are instead patches, el will always be set by the instead patches
    if (instead) for (const cb of instead) el = cb(args, jsx)
    // If there aren't any instead patches, we compute el normally, and it will be set
    else el = Reflect.apply(orig, ReactJSXRuntime, args)

    if (after) for (const cb of after) el = cb(el!)

    return el!
}

instead(ReactJSXRuntime, 'jsx', patch)
instead(ReactJSXRuntime, 'jsxs', patch)
