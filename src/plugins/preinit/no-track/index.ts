import { DispatcherModuleId } from '@revenge-mod/discord/common/flux'
import { byProps } from '@revenge-mod/modules/finders/filters'
import { waitForModules } from '@revenge-mod/modules/finders/wait'
import { getModuleDependencies } from '@revenge-mod/modules/metro/utils'
import { instead } from '@revenge-mod/patcher'
import { InternalPluginFlags, registerPlugin } from '@revenge-mod/plugins/_'
import { PluginFlags } from '@revenge-mod/plugins/constants'
import { noop } from '@revenge-mod/utils/callback'
import { getCurrentStack } from '@revenge-mod/utils/error'

// TODO(plugins/no-track): Block Sentry native-side
registerPlugin(
    {
        id: 'revenge.no-track',
        name: 'No Track',
        description: "Disables Discord's analytics/tracking, and Sentry.",
        author: 'Revenge',
        icon: 'AnalyticsIcon',
    },
    {
        preInit({ cleanup, plugin }) {
            if (plugin.flags & PluginFlags.EnabledLate)
                plugin.flags |= PluginFlags.ReloadRequired

            // utils/SentryUtils.native.tsx
            const unsubSU = waitForModules(
                byProps<{
                    profiledRootComponent<T>(x: T): T
                    addBreadcrumb(): void
                    setTags(): void
                    setUser(): void
                }>('profiledRootComponent'),
                SentryUtils => {
                    unsubSU()

                    // These functions by Discord attempt to call Sentry APIs that set __SENTRY__
                    instead(
                        SentryUtils,
                        'profiledRootComponent',
                        args => args[0],
                    )
                    instead(SentryUtils, 'addBreadcrumb', noop)
                    instead(SentryUtils, 'setTags', noop)
                    instead(SentryUtils, 'setUser', noop)
                },
            )

            // modules/errors/native/SentryInitUtils.tsx
            const unsubSIU = waitForModules(
                byProps('initSentry'),
                SentryInitUtils => {
                    unsubSIU()

                    instead(SentryInitUtils, 'initSentry', noop)
                },
            )

            // Discord uses ReactNavigationInstrumentation to track navigation
            // Discord also uses Profiler to track performance, but we blocked that by patching profiledRootComponent
            // Note that to actually find Sentry, we just need to add 'init' to byProps
            const unsubSentryInst = waitForModules(
                byProps('ReactNavigationInstrumentation'),
                exports => {
                    unsubSentryInst()

                    instead(
                        exports,
                        'ReactNavigationInstrumentation',
                        function () {
                            // https://docs.sentry.io/platforms/react-native/tracing/instrumentation/react-navigation/#initialization
                            this.registerNavigationContainer = noop
                        },
                    )
                },
            )

            if (__DEV__)
                Object.defineProperty(globalThis, '__SENTRY__', {
                    set: () => warnSetSentry(getCurrentStack()),
                })
            else
                Object.defineProperty(globalThis, '__SENTRY__', {
                    writable: false,
                })

            cleanup(unsubSU, unsubSIU, unsubSentryInst)
        },
        init({ cleanup, logger }) {
            // utils/AnalyticsUtils.tsx
            const unsubAU = waitForModules(
                byProps<{
                    trackNetworkAction: () => void
                    default: {
                        track: () => void
                        AnalyticsActionHandlers: Record<string, () => void>
                    }
                }>('trackNetworkAction'),
                AnalyticsUtils => {
                    unsubAU()

                    logger.info('Patching AnalyticsUtils...')
                    instead(AnalyticsUtils.default, 'track', noop)
                    instead(AnalyticsUtils, 'trackNetworkAction', noop)

                    for (const key in AnalyticsUtils.default
                        .AnalyticsActionHandlers)
                        instead(
                            AnalyticsUtils.default.AnalyticsActionHandlers,
                            key,
                            noop,
                        )
                },
            )

            // modules/app_analytics/useTrackImpression.tsx
            const unsubTI = waitForModules(
                byProps<{
                    default: () => void
                    trackImpression: () => void
                }>('trackImpression'),
                useTrackImpression => {
                    unsubTI()

                    logger.info('Patching useTrackImpression...')

                    instead(useTrackImpression, 'trackImpression', noop)
                    instead(useTrackImpression, 'default', noop)
                },
            )

            // actions/AnalyticsTrackActionCreators.tsx
            const unsubATAC = waitForModules(
                byProps('track'),
                (AnalyticsTrackActionCreators, id) => {
                    if (getModuleDependencies(id)![0] === DispatcherModuleId) {
                        unsubATAC()

                        logger.info('Patching AnalyticsTrackActionCreators...')
                        instead(AnalyticsTrackActionCreators, 'track', noop)
                    }
                },
            )

            cleanup(unsubAU, unsubTI, unsubATAC)
        },
        stop({ plugin }) {
            plugin.flags |= PluginFlags.ReloadRequired
        },
    },
    PluginFlags.Enabled,
    InternalPluginFlags.Internal,
)

function warnSetSentry(stack: string) {
    nativeLoggingHook(
        `\u001b[33mNo Track: Attempt to set __SENTRY__\n${stack}`,
        2,
    )
}
