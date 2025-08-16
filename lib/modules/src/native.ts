const turboModuleProxy = globalThis.__turboModuleProxy

/**
 * Backwards compatible way to get a native module. Throws an error if the module is not found.
 *
 * Use this as a replacement to `TurboModuleRegistry.getEnforcing()`.
 *
 * @see {@link https://github.com/facebook/react-native/blob/main/packages/react-native/Libraries/TurboModule/TurboModuleRegistry.js#L19-L39 React Native's source}
 *
 * @param name The name of the native module to get.
 */
export function getNativeModule<T>(name: string): T | null {
    const module =
        // Non-bridgeless with TurboModules
        turboModuleProxy?.(name) ??
        // Bridgeless & legacy modules
        nativeModuleProxy[name]

    if (module) return module as T

    throw new Error(`Unable to access native module: ${name}`)
}

const Bridge = getNativeModule<{
    getBBox(handle: number, options: object): object
}>('RNSVGRenderableModule')!

const BridgePromise = getNativeModule<{
    readAsDataURL(map: object): Promise<any>
}>('FileReaderModule')!

function makePayload(name: string, args: any[]): object {
    return {
        revenge: {
            method: name,
            args: args,
        },
    }
}

/**
 * Calls a method on the native module and returns a promise that resolves with the result.
 *
 * @param name The name of the native method to call.
 * @param args The arguments to pass to the native method.
 * @returns A promise that resolves with the result of the native method call.
 */
export async function callMethod<T>(name: string, args: any[]): Promise<T> {
    const result = await BridgePromise.readAsDataURL(makePayload(name, args))

    if ('error' in result)
        throw new Error(`Call failed: ${result.error as string}`)
    if ('result' in result) return result.result as T

    throw new Error(
        'Call failed: The module did not return a valid result. The native hook must have failed.',
    )
}

/**
 * Calls a method on the native module synchronously and returns the result.
 *
 * Only use synchronous methods when absolutely necessary, as they block JS execution until the native method returns.
 *
 * @param name The name of the native method to call.
 * @param args The arguments to pass to the native method.
 * @returns The result of the native method call.
 */
export function callMethodSync<T>(name: string, args: any[]): T {
    try {
        const result = Bridge.getBBox(0, makePayload(name, args))

        if ('error' in result) throw result.error
        if ('result' in result) return result.result as T

        throw 'The module did not return a valid result. The native hook must have failed.'
    } catch (error) {
        throw new Error(
            `Call failed: ${error instanceof Error ? error.message : String(error)}`,
        )
    }
}
