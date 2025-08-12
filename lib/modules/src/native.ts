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
