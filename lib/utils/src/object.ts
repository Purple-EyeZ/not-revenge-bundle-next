import { getCurrentStack } from './error'
import type { AnyObject } from './types'

/**
 * Simple check if to see if value is an object.
 *
 * @param val The value to check.
 */
export function isObject(val: any): val is AnyObject {
    return typeof val === 'object' && val !== null && !Array.isArray(val)
}

/**
 * Deep merge two objects.
 *
 * @param target The object to merge into.
 * @param source The object to merge from.
 *
 * @returns The merged target.
 */
export function mergeDeep(target: AnyObject, source: AnyObject) {
    if (isObject(target) && isObject(source))
        for (const [key, value] of Object.entries(source))
            if (isObject(value)) {
                if (!target[key]) Object.assign(target, { [key]: {} })
                mergeDeep(target[key], value)
            } else Object.assign(target, { [key]: value })

    return target
}

/**
 * Define a lazy property on an object that will be loaded when accessed.
 *
 * @param target The target object to define the property on.
 * @param property The property key to define.
 * @param loader The function that will be called to load the property value when accessed.
 * @return The target object with the lazy property defined.
 */
export function defineLazyProperty<T extends object, K extends keyof T>(
    target: T,
    property: K,
    loader: () => T[K],
) {
    return Object.defineProperty(
        target,
        property,
        lazyPropDesc<T, K>(property, loader),
    )
}

/**
 * Define multiple lazy properties on an object that will be loaded when accessed.
 *
 * @param target The target object to define the properties on.
 * @param loaders An object where each key is a property name and the value is a function that returns the property value when accessed.
 * @returns The target object with the lazy properties defined.
 */
export function defineLazyProperties<T extends object>(
    target: T,
    loaders: Partial<Record<keyof T, () => T[keyof T]>>,
) {
    const descs: PropertyDescriptorMap = {}

    for (const [key, loader] of Object.entries(loaders) as Array<
        [keyof T, (typeof loaders)[keyof T]]
    >)
        descs[key] = lazyPropDesc<T, keyof typeof loaders>(key, loader!)

    return Object.defineProperties(target, descs)
}

function lazyPropDesc<T extends object, K extends keyof T>(
    key: K,
    loader: () => T[K],
): PropertyDescriptor {
    if (__BUILD_FLAG_DEBUG_LAZY_VALUES__) {
        const value = loader()
        if (value == null) DEBUG_warnNullishLazyValue(key)

        return {
            configurable: true,
            value,
        }
    }

    return {
        configurable: true,
        get(this: T) {
            delete this[key]
            return (this[key] = loader())
        },
    }
}

function DEBUG_warnNullishLazyValue(key: PropertyKey) {
    nativeLoggingHook(
        `\u001b[33mLazy property ${String(key)} is being initialized to a nullish value:\n${getCurrentStack()}\u001b[0m`,
        2,
    )
}
