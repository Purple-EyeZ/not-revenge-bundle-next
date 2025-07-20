import { TypedEventEmitter } from '@revenge-mod/discord/common/utils'
import { getErrorStack } from '@revenge-mod/utils/error'
import { allSettled, sleepReject } from '@revenge-mod/utils/promise'
import { pUnscopedApi as uapi } from '../apis'
import {
    PluginFlags as Flag,
    PluginFlags,
    PluginStatus as Status,
} from '../constants'
import { decoratePluginApi, pDecorators } from './decorators'
import { pLeafOrSingleNodes, pPending } from './dependency-graph'
import type {
    InitPluginApi,
    Plugin,
    PluginApi,
    PluginApiExtensionsOptions,
    PluginCleanup,
    PluginManifest,
    PluginOptions,
    PreInitPluginApi,
} from '../types'

export type AnyPlugin = Plugin<any, any>

export const pUnscopedApi = uapi
export const pEmitter = new TypedEventEmitter<{
    register: [AnyPlugin, PluginOptions<any>, update?: true]
    disabled: [AnyPlugin]
    enabled: [AnyPlugin]
    preInited: [AnyPlugin]
    inited: [AnyPlugin]
    started: [AnyPlugin]
    stopped: [AnyPlugin]
    errored: [AnyPlugin, unknown]
}>()

export const pList = new Map<PluginManifest['id'], AnyPlugin>()
export const pMetadata = new WeakMap<AnyPlugin, InternalPluginMeta>()

export interface InternalPluginMeta {
    handleError: (e: unknown) => Promise<void>
    promises: Promise<void>[]
    cleanups: PluginCleanup[]
    iflags: number
    apiLevel: number
    dependents: AnyPlugin[]
    options: PluginOptions<any>
}

export function registerPlugin<O extends PluginApiExtensionsOptions>(
    manifest: PluginManifest,
    options: PluginOptions<O>,
    flags: number,
    iflags: number,
) {
    // TODO(plugins): verify plugin manifest
    if (pList.has(manifest.id))
        throw new Error(`Plugin with ID "${manifest.id}" already registered`)

    const plugin: AnyPlugin = {
        errors: [],
        manifest,
        lifecycles: {
            preInit: options.preInit,
            init: options.init,
            start: options.start,
            stop: options.stop,
        },
        SettingsComponent: options.SettingsComponent,
        status: 0,
        flags,
        disable: () => disablePlugin(plugin),
        stop: () => stopPlugin(plugin),
        api: undefined,
    }

    const meta: InternalPluginMeta = {
        cleanups: [],
        promises: [],
        iflags,
        apiLevel: PluginApiLevel.None,
        dependents: [],
        handleError: e => handlePluginError(e, plugin),
        options,
    }

    pMetadata.set(plugin, meta)
    pList.set(manifest.id, plugin)

    if (iflags & InternalPluginFlags.ImplicitDependency)
        pLeafOrSingleNodes.add(plugin)
    // Only add to pending if the plugin is enabled
    else if (flags & PluginFlags.Enabled) pPending.add(plugin)

    pEmitter.emit('register', plugin, options)
}

async function handlePluginError(e: unknown, plugin: AnyPlugin) {
    plugin.errors.push(e)
    plugin.flags |= Flag.Errored
    const { iflags } = pMetadata.get(plugin)!

    nativeLoggingHook(
        `\u001b[31mPlugin "${plugin.manifest.id}" encountered an error: ${getErrorStack(e)}\u001b[0m`,
        2,
    )

    plugin.api.logger?.error('Plugin encountered an error', e)

    pEmitter.emit('errored', plugin, e)

    if (!(iflags & InternalPluginFlags.Essential)) await plugin.disable()
}

function preparePluginPreInit(plugin: AnyPlugin) {
    const meta = pMetadata.get(plugin)!

    // Clear errors from previous runs
    plugin.errors = []
    plugin.status &= ~Flag.Errored

    plugin.api = {
        cleanup: (...items) => {
            meta.cleanups.push(...items)
        },
        plugin,
        unscoped: pUnscopedApi,
        decorate: decorator => {
            pDecorators.preInit.push([decorator, meta.handleError])
        },
    } satisfies PreInitPluginApi

    decoratePluginApi(pDecorators.preInit, plugin, meta)

    meta.apiLevel = PluginApiLevel.PreInit
}

function preparePluginInit(plugin: AnyPlugin) {
    const meta = pMetadata.get(plugin)!
    const api = plugin.api as InitPluginApi
    api.decorate = decorator => {
        pDecorators.init.push([decorator, meta.handleError])
    }

    decoratePluginApi(pDecorators.init, plugin, meta)

    meta.apiLevel = PluginApiLevel.Init
}

function preparePluginStart(plugin: AnyPlugin) {
    const meta = pMetadata.get(plugin)!
    const api = plugin.api as PluginApi
    api.decorate = decorator => {
        pDecorators.start.push([decorator, meta.handleError])
    }

    decoratePluginApi(pDecorators.start, plugin, meta)

    meta.apiLevel = PluginApiLevel.Start
}

async function disablePlugin(plugin: AnyPlugin) {
    if (!(plugin.flags & Flag.Enabled))
        throw new Error(`Plugin "${plugin.manifest.id}" is not enabled`)

    const iflags = pMetadata.get(plugin)!.iflags ?? 0
    if (iflags & InternalPluginFlags.Essential)
        throw new Error(
            `Plugin "${plugin.manifest.id}" is essential and cannot be disabled`,
        )

    // If plugin is not stopped, and is also not stopping, we need to stop it
    if (plugin.status && !(plugin.status & Status.Stopping))
        await stopPlugin(plugin)

    // TODO(plugins): write to storage
    plugin.flags &= ~Flag.Enabled

    pEmitter.emit('disabled', plugin)
}

export function enablePlugin(plugin: AnyPlugin, late: boolean) {
    if (plugin.flags & Flag.Enabled)
        throw new Error(`Plugin "${plugin.manifest.id}" is already enabled`)

    // TODO(plugins): write to storage
    plugin.flags |= Flag.Enabled
    if (late) plugin.flags |= Flag.EnabledLate

    pEmitter.emit('enabled', plugin)
}

export async function preInitPlugin(plugin: AnyPlugin) {
    const {
        manifest: { id },
        lifecycles,
    } = plugin
    try {
        if (!lifecycles.preInit) return

        const meta = pMetadata.get(plugin)!
        const { promises, handleError } = meta

        if (!(plugin.flags & Flag.Enabled))
            throw new Error(`Plugin "${id}" is not enabled`)
        if (plugin.status & (Status.PreIniting | Status.PreInited))
            throw new Error(
                `Plugin preInit lifecycle for "${id}" is already running`,
            )

        preparePluginPreInit(plugin)

        plugin.status |= Status.PreIniting

        try {
            const prom = lifecycles.preInit(plugin.api as PreInitPluginApi)
            promises.push(prom)
            await prom

            // plugin.disable() already handles, so it's in the try block
            plugin.status |= Status.PreInited
            plugin.status &= ~Status.PreIniting
        } catch (e) {
            await handleError(e)
        }
    } finally {
        pEmitter.emit('preInited', plugin)
    }
}

export async function initPlugin(plugin: AnyPlugin) {
    const {
        manifest: { id },
        lifecycles,
    } = plugin

    try {
        if (!lifecycles.init) return

        const meta = pMetadata.get(plugin)!
        const { promises, apiLevel, handleError } = meta

        if (!(plugin.flags & Flag.Enabled))
            throw new Error(`Plugin "${id}" is not enabled`)
        if (plugin.status & (Status.Initing | Status.Inited))
            throw new Error(
                `Plugin init lifecycle for "${id}" is already running`,
            )

        if (apiLevel < PluginApiLevel.PreInit) preparePluginPreInit(plugin)
        if (apiLevel < PluginApiLevel.Init) preparePluginInit(plugin)

        plugin.status |= Status.Initing

        try {
            const prom = lifecycles.init(plugin.api as InitPluginApi)
            promises.push(prom)
            await prom

            // plugin.disable() already handles, so it's in the try block
            plugin.status |= Status.Inited
            plugin.status &= ~Status.Initing
        } catch (e) {
            await handleError(e)
        }
    } finally {
        pEmitter.emit('inited', plugin)
    }
}

export async function startPlugin(plugin: AnyPlugin) {
    const {
        manifest: { id },
        lifecycles,
    } = plugin

    try {
        if (!lifecycles.start) return

        const meta = pMetadata.get(plugin)!
        const { promises, apiLevel, handleError } = meta

        if (!(plugin.flags & Flag.Enabled))
            throw new Error(`Plugin "${id}" is not enabled`)
        if (plugin.status & (Status.Starting | Status.Started))
            throw new Error(
                `Plugin start lifecycle for "${id}" is already running`,
            )

        if (apiLevel < PluginApiLevel.PreInit) preparePluginPreInit(plugin)
        if (apiLevel < PluginApiLevel.Init) preparePluginInit(plugin)
        if (apiLevel < PluginApiLevel.Start) preparePluginStart(plugin)

        plugin.status |= Status.Starting

        try {
            const prom = lifecycles.start(plugin.api as PluginApi)
            promises.push(prom)
            await prom

            // disablePlugin() already handles cleaning up statuses, so it's in the try block
            plugin.status |= Status.Started
            plugin.status &= ~Status.Starting
        } catch (e) {
            await handleError(e)
        }
    } finally {
        pEmitter.emit('started', plugin)
    }
}

const MaxWaitTime = 5000

export async function stopPlugin(plugin: AnyPlugin) {
    const {
        manifest: { id },
        lifecycles,
    } = plugin
    const meta = pMetadata.get(plugin)!
    const { promises, iflags, apiLevel } = meta

    if (iflags & InternalPluginFlags.Essential)
        throw new Error(`Plugin "${id}" is essential and cannot be stopped`)

    if (!(plugin.flags & Flag.Enabled))
        throw new Error(`Plugin "${id}" is not enabled`)
    if (plugin.status & Status.Stopping)
        throw new Error(`Plugin "${id}" is stopping`)

    // If the plugin is running its lifecycles, we need to wait for it to finish, then we'll stop it
    // We want to wait at max 5 seconds for the lifecycles to finish
    if (plugin.status & (Status.PreIniting | Status.Initing | Status.Starting))
        await Promise.race([
            Promise.all(promises),
            sleepReject(
                MaxWaitTime,
                'Plugin lifecycles timed out, force stopping',
            ),
        ])
            .then(finished => {
                // If the lifecycles don't finish in 5 seconds, a reload is probably required to unapply the changes
                if (!finished) plugin.flags |= Flag.ReloadRequired
            })
            .catch(e => {
                handlePluginError(e, plugin)
            })
    else if (
        !(plugin.status & (Status.PreInited | Status.Inited | Status.Started))
    )
        throw new Error(`Plugin "${id}" is not running`)

    if (apiLevel < PluginApiLevel.PreInit) preparePluginPreInit(plugin)
    if (apiLevel < PluginApiLevel.Init) preparePluginInit(plugin)
    if (apiLevel < PluginApiLevel.Start) preparePluginStart(plugin)

    plugin.status |= Status.Stopping

    try {
        if (!lifecycles.stop) return

        await Promise.race([
            lifecycles.stop(plugin.api as PluginApi),
            sleepReject(
                MaxWaitTime,
                'Plugin stop lifecycle timed out, force stopping',
            ),
        ])
    } catch (e) {
        await handlePluginError(e, plugin)
    } finally {
        // Run cleanups

        function handleStopError(e: unknown) {
            // Some cleanup was unsuccessful, so we need to reload the app
            plugin.flags |= Flag.ReloadRequired
            return handlePluginError(e, plugin)
        }

        try {
            const results = await allSettled(
                meta.cleanups.map(cleanup => cleanup()),
            )

            await Promise.all(
                results.map(
                    result =>
                        result.status === 'rejected' &&
                        handleStopError(result.reason),
                ),
            )
        } catch (e) {
            await handleStopError(e)
        }

        // Reset APIs
        plugin.api = undefined
        meta.apiLevel = PluginApiLevel.None

        // Clear temp data
        meta.promises = []
        meta.cleanups = []

        // Reset status
        plugin.status = 0

        pEmitter.emit('stopped', plugin)
    }
}

export const InternalPluginFlags = {
    /**
     * Marks the plugin as internal.
     */
    Internal: 1 << 0,
    /**
     * Marks the plugin as essential. This means it should not be removed, disabled, or stopped by normal means.
     */
    Essential: 1 << 1,
    /**
     * Marks the plugin as a leaf node in the plugin graph, implicitly making it a dependency for every plugin (as they are executed first).
     * This means it has no dependencies, but may have dependents, and it will be started first.
     */
    ImplicitDependency: 1 << 2,
}

const PluginApiLevel = {
    None: 0,
    PreInit: 1,
    Init: 2,
    Start: 3,
} as const
