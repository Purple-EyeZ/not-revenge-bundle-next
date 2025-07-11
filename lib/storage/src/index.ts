// TODO(storage): Implement using NativeModules interop instead

import { FileModule } from '@revenge-mod/discord/native'
import { getErrorStack } from '@revenge-mod/utils/error'
import { mergeDeep } from '@revenge-mod/utils/object'
import type { AnyObject, DeepPartial } from '@revenge-mod/utils/types'

export type StorageSubscription<T extends AnyObject = AnyObject> = (
    v: DeepPartial<T>,
) => void

export function Storage<T extends AnyObject>(
    this: Storage<T>,
    path: string,
    options?: StorageOptions<T>,
) {
    const { CacheDirPath, DocumentsDirPath } = FileModule.getConstants()

    const directory = options?.directory ?? 'documents'
    const dirPath = directory === 'cache' ? CacheDirPath : DocumentsDirPath
    const fullPath = `${dirPath}/${path}`

    this._s = new Set<StorageSubscription<T>>()

    this.loaded = false
    this.cache = options?.default

    this.exists = () => FileModule.fileExists(fullPath)
    this.delete = () => FileModule.removeFile(directory, path)

    this.get = async function () {
        if (!(await this.exists())) {
            this.cache = options?.default ?? {}
            await this.set({})
            this.loaded = true
            return this.cache
        }

        const contents = await FileModule.readFile(fullPath, 'utf8')
        if (contents) {
            this.loaded = true
            try {
                const cache = (this.cache = JSON.parse(contents))
                for (const sub of this._s) sub(cache)
                return cache
            } catch (e) {
                nativeLoggingHook(
                    `Failed to parse storage (<${directory}>/${path}): ${getErrorStack(e)}`,
                    2,
                )
            }
        }
    }

    this.set = async function (value) {
        if (!this.cache) await this.get()
        mergeDeep(this.cache!, value)

        try {
            const contents = JSON.stringify(this.cache)
            await FileModule.writeFile(directory, path, contents, 'utf8')

            for (const sub of this._s) sub(value)
        } catch (e) {
            nativeLoggingHook(
                `Failed to write storage (<${directory}>/${path}): ${getErrorStack(e)}`,
                2,
            )
        }
    }
}

// React is only initialized right before the init stage, so this is a dummy method
// See init.ts for the actual implementation
Storage.prototype.use = () => {
    throw new Error('Storage#use can only be called after the init stage!')
}

/**
 * Get a storage object for a given path and directory.
 *
 * @param path Path relative to the directory.
 * @param directory Directory to use. Can be either 'cache' or 'documents'.
 */
export function getStorage<T extends AnyObject = AnyObject>(
    path: string,
    options?: StorageOptions<T>,
): Storage<T> {
    const storage: Storage<T> = Object.create(Storage.prototype)
    Storage.call(storage, path, options)

    if (options?.load) storage.get()

    return storage
}

export interface StorageOptions<T extends AnyObject = AnyObject> {
    /**
     * The directory of the storage file.
     */
    directory?: StorageDirectory
    /**
     * The default value to use for the storage. This will also be used for cache.
     */
    default?: T
    /**
     * Automatically load the storage after creating the instance.
     */
    load?: boolean
}

export type UseStorageFilter<T extends AnyObject> = (
    newValue: DeepPartial<T>,
) => any

export interface Storage<T extends AnyObject> {
    /**
     * @internal
     */
    _s: Set<StorageSubscription<T>>
    /**
     * Whether the storage has been loaded. If the storage is not loaded, `storage.cache` may be `undefined`.
     * If you have `options.default` set, you can use this property to check if `storage.cache` is the default value or not.
     */
    loaded: boolean
    /**
     * The cached storage object. Set once `get()` is called, or `options.default` is set, and updated on `set()`.
     * You should not modify this directly.
     */
    cache?: T | AnyObject
    /**
     * Use the storage in a React component. The component will re-render when the storage is updated.
     *
     * This can only be used in the `init` stage or later, as it requires React to be initialized.
     *
     * @example
     * ```tsx
     * type Settings = { key: boolean, nested: { key: boolean } }
     *
     * const SettingsStorage = getStorage<Settings>('settings.json')
     *
     * const MyComponent = () => {
     *   // Re-renders every time any of the keys in the settings object change
     *   const settings = SettingsStorage.use()
     *   // const settings: Settings | undefined
     *
     *   // ...
     * }
     *
     * const MyComponent2 = () => {
     *  // Re-renders every time the new value matches the filter
     *  const settings = SettingsStorage.use(val => val.key !== undefined)
     *  // const settings: Settings | undefined
     *
     *  // ...
     * }
     */

    use(filter?: UseStorageFilter<T>): T | undefined
    /**
     * Get the storage.
     */
    get(): Promise<T>
    /**
     * Set the storage.
     *
     * @param value The value to merge into the storage.
     */
    set(value: DeepPartial<T>): Promise<void>
    /**
     * Whether the storage is exists.
     */
    exists(): Promise<boolean>
    /**
     * Delete the storage.
     */
    delete(): Promise<boolean>
}

export type StorageDirectory = 'cache' | 'documents'
