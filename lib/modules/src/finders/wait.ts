import { mInitialized } from '../metro/_internal'
import {
    onAnyModuleInitialized,
    onModuleFinishedImporting,
} from '../metro/subscriptions'
import { getInitializedModuleExports } from '../metro/utils'
import {
    exportsFromFilterResultFlag,
    FilterResultFlagToHumanReadable,
    runFilter,
} from './_internal'
import type { MaybeDefaultExportMatched, Metro } from '../types'
import type {
    FilterResultFlag,
    RunFilterReturnExportsOptions,
} from './_internal'
import type { Filter, FilterResult } from './filters'

export interface BaseWaitForModulesOptions<All extends boolean = boolean> {
    /**
     * Whether to include all modules, including blacklisted ones.
     *
     * @default false
     */
    all?: All
}

export type WaitForModulesUnsubscribeFunction = () => boolean

export type WaitForModulesCallback<T> = (exports: T, id: Metro.ModuleID) => any

export type WaitForModulesOptions<
    ReturnNamespace extends boolean = boolean,
    All extends boolean = boolean,
> = RunFilterReturnExportsOptions<ReturnNamespace> &
    BaseWaitForModulesOptions<All>

export type WaitForModulesResult<
    F extends Filter,
    O extends WaitForModulesOptions,
> = O extends RunFilterReturnExportsOptions<true>
    ? MaybeDefaultExportMatched<FilterResult<F>>
    : FilterResult<F>

/**
 * Wait for modules to initialize. **Callback won't be called if the module is already initialized!**
 *
 * @param filter The filter to use.
 * @param callback The callback to call when matching modules are initialized.
 * @param options The options to use for the wait.
 * @returns A function to unsubscribe.
 *
 * @example
 * ```ts
 * const unsub = waitForModules(
 *   byName<typeof import('@shopify/flash-list')>('FlashList'),
 *   // (exports: typeof import('@shopify/flash-list'), id: Metro.ModuleID) => any
 *   (exports, id) => {
 *     unsub()
 *     // Do something with the module...
 *   }
 * )
 * ```
 */
export function waitForModules<F extends Filter>(
    filter: F,
    callback: WaitForModulesCallback<WaitForModulesResult<F, object>>,
): WaitForModulesUnsubscribeFunction

export function waitForModules<
    F extends O extends WaitForModulesOptions<boolean, true>
        ? Filter<any, false>
        : Filter,
    O extends WaitForModulesOptions,
>(
    filter: F,
    callback: WaitForModulesCallback<WaitForModulesResult<F, O>>,
    options: O,
): WaitForModulesUnsubscribeFunction

export function waitForModules(
    filter: Filter,
    callback: WaitForModulesCallback<any>,
    options?: WaitForModulesOptions,
) {
    if (__BUILD_FLAG_DEBUG_MODULE_WAITS__)
        nativeLoggingHook(
            `\u001b[94mWaiting for module matching: \u001b[93m${filter.key}\u001b[0m`,
            1,
        )

    return onAnyModuleInitialized(
        options?.all
            ? (id, exports) => {
                  const flag = runFilter(filter, id, exports, options)
                  if (flag) {
                      if (__BUILD_FLAG_DEBUG_MODULE_WAITS__)
                          DEBUG_logWaitMatched(filter.key, id, flag)

                      callback(
                          exportsFromFilterResultFlag(flag, exports, options),
                          id,
                      )
                  }
              }
            : (id, exports) => {
                  if (mInitialized.has(id)) {
                      const flag = runFilter(filter, id, exports, options)
                      if (flag) {
                          if (__BUILD_FLAG_DEBUG_MODULE_WAITS__)
                              DEBUG_logWaitMatched(filter.key, id, flag)

                          callback(
                              exportsFromFilterResultFlag(
                                  flag,
                                  exports,
                                  options,
                              ),
                              id,
                          )
                      }
                  }
              },
    )
}

/**
 * Wait for a module to initialize by its imported path. **Callback won't be called if the module is already initialized!**
 *
 * Once callback is called, the subscription will be removed automatically, because modules have unique imported paths.
 *
 * Think of it as if you are doing `import * as exports from path`, and you are also waiting for the app to initialize the module by itself.
 *
 * @param path The path to wait for.
 * @param callback The callback to call once the module is initialized.
 * @param options The options to use for the wait.
 * @returns A function to unsubscribe.
 *
 * @example
 * ```ts
 * waitForModuleByImportedPath(
 *   'utils/PlatformUtils.tsx',
 *   (exports, id) => {
 *      // Do something with the module...
 *   }
 * )
 * ```
 */
export function waitForModuleByImportedPath<T = any>(
    path: string,
    callback: WaitForModulesCallback<T>,
    options?: BaseWaitForModulesOptions,
) {
    const unsub = onModuleFinishedImporting(
        options?.all
            ? (id, cmpPath) => {
                  if (path === cmpPath) {
                      unsub()
                      callback(getInitializedModuleExports(id), id)
                  }
              }
            : (id, cmpPath) => {
                  if (mInitialized.has(id) && path === cmpPath) {
                      unsub()
                      callback(getInitializedModuleExports(id), id)
                  }
              },
    )

    return unsub
}

/**
 * Logs to the developer that a module wait has matched.
 */
function DEBUG_logWaitMatched(
    key: string,
    id: Metro.ModuleID,
    flag: FilterResultFlag,
) {
    nativeLoggingHook(
        `\u001b[32mWait matched: \u001b[33m${key}\u001b[0m (matched ${id}, ${FilterResultFlagToHumanReadable[flag]})`,
        1,
    )
}
