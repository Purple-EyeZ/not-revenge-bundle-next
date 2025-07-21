import { TypedEventEmitter } from '@revenge-mod/discord/common/utils'
import { getErrorStack } from '@revenge-mod/utils/error'
import { sleepReject } from '@revenge-mod/utils/promise'
import { pUnscopedApi as uapi } from '../apis'
import {
    PluginFlags as Flag,
    PluginFlags,
    PluginStatus as Status,
} from '../constants'
import {
    addPluginApiDecorator,
    decoratePluginApi,
    pDecoratorsInit,
    pDecoratorsPreInit,
    pDecoratorsStart,
    pImplicitDeps,
} from './decorators'
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

const MaxWaitTime = 5000

const PluginApiLevel = {
    None: 0,
    PreInit: 1,
    Init: 2,
    Start: 3,
} as const

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
     * Marks the plugin as a dependency of all other plugins.
     */
    ImplicitDependency: 1 << 2,
}

export interface InternalPluginMeta {
    handleError: (e: unknown) => Promise<void>
    promises: Promise<void>[]
    cleanups: PluginCleanup[]
    iflags: number
    apiLevel: number
    dependents: AnyPlugin[]
    dependencies?: AnyPlugin[]
    options: PluginOptions<any>
}

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

/**
 * Registers a new plugin with the system.
 */
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

    if (iflags & InternalPluginFlags.ImplicitDependency) {
        pLeafOrSingleNodes.add(plugin)
        pImplicitDeps.add(plugin)
    }
    // Only add to pending if the plugin is enabled
    else if (flags & PluginFlags.Enabled) pPending.add(plugin)

    pEmitter.emit('register', plugin, options)
}

/**
 * Gets dependencies for a plugin.
 */
export function getPluginDependencies(plugin: AnyPlugin): AnyPlugin[] {
    const meta = pMetadata.get(plugin)!
    if (meta.dependencies) return meta.dependencies

    const { dependencies, id } = plugin.manifest
    const deps: AnyPlugin[] = []

    if (dependencies?.length)
        for (const { id: depId } of dependencies) {
            const dep = pList.get(depId)

            if (dep) {
                if (dep.flags & PluginFlags.Enabled) deps.push(dep)
                else
                    throw new Error(
                        `Plugin "${id}" depends on disabled plugin "${depId}"`,
                    )
            } else {
                // TODO: Once external plugins are implemented, we will have to check the external plugin registry here as well
                // External plugin registry should ideally be Record<PluginManifest['id'], [PluginManifest, Flags: number, PluginCode: string]>
                // Then we register the plugin here and do dep = pList.get(id) again

                throw new Error(
                    `Plugin "${id}" depends on unregistered plugin "${depId}"`,
                )
            }
        }

    return (meta.dependencies = deps)
}

/**
 * Handles errors that occur in plugins.
 */
async function handlePluginError(e: unknown, plugin: AnyPlugin) {
    plugin.errors.push(e)
    plugin.flags |= Flag.Errored
    const { iflags } = pMetadata.get(plugin)!

    nativeLoggingHook(
        `\u001b[31mPlugin "${plugin.manifest.id}" encountered an error: ${getErrorStack(e)}\u001b[0m`,
        2,
    )

    plugin.api?.logger?.error('Plugin encountered an error', e)
    pEmitter.emit('errored', plugin, e)

    if (!(iflags & InternalPluginFlags.Essential)) await plugin.disable()
}

/**
 * Prepares the plugin API for the preInit lifecycle.
 */
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
            addPluginApiDecorator(pDecoratorsPreInit, plugin, decorator)
        },
    } satisfies PreInitPluginApi

    decoratePluginApi(pDecoratorsPreInit, plugin, meta)
    meta.apiLevel = PluginApiLevel.PreInit
}

/**
 * Prepares the plugin API for the init lifecycle.
 */
function preparePluginInit(plugin: AnyPlugin) {
    const meta = pMetadata.get(plugin)!
    const api = plugin.api as InitPluginApi

    api.decorate = decorator => {
        addPluginApiDecorator(pDecoratorsInit, plugin, decorator)
    }

    decoratePluginApi(pDecoratorsInit, plugin, meta)
    meta.apiLevel = PluginApiLevel.Init
}

/**
 * Prepares the plugin API for the start lifecycle.
 */
function preparePluginStart(plugin: AnyPlugin) {
    const meta = pMetadata.get(plugin)!
    const api = plugin.api as PluginApi

    api.decorate = decorator => {
        addPluginApiDecorator(pDecoratorsStart, plugin, decorator)
    }

    decoratePluginApi(pDecoratorsStart, plugin, meta)
    meta.apiLevel = PluginApiLevel.Start
}

/**
 * Disables a plugin.
 */
export async function disablePlugin(plugin: AnyPlugin) {
    if (!(plugin.flags & Flag.Enabled))
        throw new Error(`Plugin "${plugin.manifest.id}" is not enabled`)

    const iflags = pMetadata.get(plugin)!.iflags ?? 0
    if (iflags & InternalPluginFlags.Essential)
        throw new Error(
            `Plugin "${plugin.manifest.id}" is essential and cannot be disabled`,
        )

    // Stop the plugin if needed
    if (plugin.status && !(plugin.status & Status.Stopping))
        await stopPlugin(plugin)

    // TODO(plugins): write to storage
    plugin.flags &= ~Flag.Enabled
    pEmitter.emit('disabled', plugin)
}

/**
 * Enables a plugin.
 */
export function enablePlugin(plugin: AnyPlugin, late: boolean) {
    if (plugin.flags & Flag.Enabled)
        throw new Error(`Plugin "${plugin.manifest.id}" is already enabled`)

    // TODO(plugins): write to storage
    plugin.flags |= Flag.Enabled
    if (late) plugin.flags |= Flag.EnabledLate

    pEmitter.emit('enabled', plugin)
}

/**
 * Runs the preInit lifecycle of a plugin.
 */
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

/**
 * Runs the init lifecycle of a plugin.
 */
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

/**
 * Starts a plugin by running its start lifecycle.
 */
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

            plugin.status |= Status.Started
            plugin.status &= ~Status.Starting
        } catch (e) {
            await handleError(e)
        }
    } finally {
        pEmitter.emit('started', plugin)
    }
}

/**
 * Stops a plugin by running its stop lifecycle and cleanup functions.
 */
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
        throw new Error(`Plugin "${id}" is already stopping`)

    // Wait for in-progress lifecycles to finish or timeout
    if (plugin.status & (Status.PreIniting | Status.Initing | Status.Starting))
        await Promise.race([
            Promise.all(promises),
            sleepReject(
                MaxWaitTime,
                'Plugin lifecycles timed out, force stopping',
            ),
        ]).catch(e => {
            plugin.flags |= Flag.ReloadRequired
            handlePluginError(e, plugin)
        })
    else if (
        !(plugin.status & (Status.PreInited | Status.Inited | Status.Started))
    )
        throw new Error(`Plugin "${id}" is not running`)

    // Prepare APIs if needed
    if (apiLevel < PluginApiLevel.PreInit) preparePluginPreInit(plugin)
    if (apiLevel < PluginApiLevel.Init) preparePluginInit(plugin)
    if (apiLevel < PluginApiLevel.Start) preparePluginStart(plugin)

    plugin.status |= Status.Stopping

    try {
        if (lifecycles.stop)
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
        await cleanupPlugin(plugin, meta)

        // Reset state
        plugin.api = undefined
        meta.apiLevel = PluginApiLevel.None
        meta.promises = []
        meta.cleanups = []
        plugin.status = 0

        pEmitter.emit('stopped', plugin)
    }
}

/**
 * Runs all cleanup functions registered by a plugin.
 */
async function cleanupPlugin(plugin: AnyPlugin, meta: InternalPluginMeta) {
    async function handleStopError(e: unknown) {
        // Some cleanup was unsuccessful, so we need to reload the app
        plugin.flags |= Flag.ReloadRequired
        return handlePluginError(e, plugin)
    }

    const proms: Promise<any>[] = []

    for (const cleanup of meta.cleanups)
        try {
            proms.push(cleanup())
        } catch (e) {
            await handleStopError(e)
        }

    await Promise.all(proms)
}
