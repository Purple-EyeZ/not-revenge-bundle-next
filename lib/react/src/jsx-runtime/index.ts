import { jPatches } from './_internal'
import type { ElementType, JSX, Key, ReactElement } from 'react'
import type { ReactJSXRuntime } from '..'

export type AnyJSXFactoryFunction = (typeof ReactJSXRuntime)['jsx' | 'jsxs']

export type BeforeJSXCallback<E extends ElementType> = (
    args: [element: E, props: ElementTypeProps<E>, key?: Key | undefined],
) => Parameters<AnyJSXFactoryFunction>

export type InsteadJSXCallback<E extends ElementType> = (
    args: [element: E, props: ElementTypeProps<E>, key?: Key | undefined],
    jsx: AnyJSXFactoryFunction,
) => ReturnType<AnyJSXFactoryFunction> | null

export type AfterJSXCallback<E extends ElementType> = (
    fiber: ReactElement<ElementTypeProps<E>, E>,
) => ReturnType<AnyJSXFactoryFunction> | null

type ElementTypeProps<E extends ElementType> = E extends ElementType<
    infer Props
>
    ? Props
    : E extends keyof JSX.IntrinsicElements
      ? JSX.IntrinsicElements[E]
      : never

/**
 * Registers a hook to be called after a JSX element with the specified type is created.
 *
 * @param type The type of the element.
 * @param patch The hook.
 * @returns A function to unpatch.
 */
export function afterJSX<E extends ElementType>(
    type: E,
    patch: AfterJSXCallback<E>,
) {
    let patches = jPatches.get(type)
    if (!patches) {
        patches = [undefined, new Set(), undefined]
        jPatches.set(type, patches)
    } else if (!patches[1]) patches[1] = new Set()

    const set = patches[1]!

    set.add(patch as AfterJSXCallback<E>)
    return () => {
        const res = set.delete(patch as AfterJSXCallback<E>)
        if (res) attemptCleanup(type)
        return res
    }
}

/**
 * Registers a hook to be called before a JSX element with the specified type is created.
 *
 * @param type The type of the element.
 * @param patch The hook.
 * @returns A function to unpatch.
 */
export function beforeJSX<E extends ElementType>(
    type: E,
    patch: BeforeJSXCallback<E>,
) {
    let patches = jPatches.get(type)
    if (!patches) {
        patches = [new Set(), undefined, undefined]
        jPatches.set(type, patches)
    } else if (!patches[0]) patches[0] = new Set()

    const set = patches[0]!

    set.add(patch as BeforeJSXCallback<E>)
    return () => {
        const res = set.delete(patch as BeforeJSXCallback<E>)
        if (res) attemptCleanup(type)
        return res
    }
}

/**
 * Registers a callback to run instead when a JSX element with the specified type is created.
 *
 * @param type The type of the element.
 * @param patch The hook.
 * @returns A function to unpatch.
 */
export function insteadJSX<E extends ElementType>(
    type: E,
    patch: InsteadJSXCallback<E>,
) {
    let patches = jPatches.get(type)
    if (!patches) {
        patches = [undefined, undefined, new Set()]
        jPatches.set(type, patches)
    } else if (!patches[2]) patches[2] = new Set()

    const set = patches[2]!

    set.add(patch as InsteadJSXCallback<E>)
    return () => {
        const res = set.delete(patch as InsteadJSXCallback<E>)
        if (res) attemptCleanup(type)
        return res
    }
}

function attemptCleanup(type: ElementType) {
    const patches = jPatches.get(type)!
    if (patches[0]?.size || patches[1]?.size || patches[2]?.size) return
    jPatches.delete(type)
}
