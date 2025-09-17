import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { AlertActionCreators } from '@revenge-mod/discord/actions'
import { Design } from '@revenge-mod/discord/design'
import {
    refreshSettingsNavigator,
    registerSettingsItem,
} from '@revenge-mod/discord/modules/settings'
import { BundleUpdaterManager } from '@revenge-mod/discord/native'
import { pEmitter, pList } from '@revenge-mod/plugins/_'
import { PluginFlags } from '@revenge-mod/plugins/constants'
import { debounce } from '@revenge-mod/utils/callback'
import { useLayoutEffect } from 'react'
import defer * as NavigatorHeaderWithIcon from './components/NavigatorHeaderWithIcon'
import { Setting } from './constants'
import type { StackScreenProps } from '@react-navigation/stack'
import type { ReactNavigationParamList } from '@revenge-mod/externals/react-navigation'
import type { AnyPlugin } from '@revenge-mod/plugins/_'
import type { PluginApi } from '@revenge-mod/plugins/types'

/// SETTINGS ROUTES

pEmitter.on('started', plugin => {
    if (plugin.SettingsComponent) {
        const api = plugin.api as PluginApi<any>
        const Component = plugin.SettingsComponent!

        function PluginSettings({
            navigation,
        }: StackScreenProps<ReactNavigationParamList>) {
            // biome-ignore lint/correctness/useExhaustiveDependencies: We only want to set options once
            useLayoutEffect(() => {
                if (plugin.manifest.icon)
                    navigation.setOptions({
                        headerTitle: () => (
                            <NavigatorHeaderWithIcon.default
                                title={plugin.manifest.name}
                                icon={plugin.manifest.icon!}
                            />
                        ),
                    })
                else
                    navigation.setOptions({
                        title: plugin.manifest.name,
                    })
            }, [])

            return <Component api={api} />
        }

        api.cleanup(
            registerSettingsItem(plugin.manifest.id, {
                parent: Setting.Revenge,
                type: 'route',
                IconComponent: plugin.manifest.icon
                    ? () => <TableRowAssetIcon name={plugin.manifest.icon!} />
                    : undefined,
                title: () => plugin.manifest.name,
                screen: {
                    route: plugin.manifest.id,
                    getComponent: () => PluginSettings,
                },
            }),
            refreshSettingsNavigator,
            // TODO(PalmDevs): In the future, we may allow pinning plugin settings, so we'll need this cleanup
            // () => refreshSettingsOverviewScreen(),
        )

        refreshSettingsNavigator()
    }
})

/// RELOAD REQUIRED ALERT

const { AlertActionButton, AlertModal, Text } = Design

function showReloadRequiredAlertIfNeeded() {
    const plugins = [...pList.values()].filter(
        plugin => plugin.flags & PluginFlags.ReloadRequired,
    )

    if (!plugins.length) return

    AlertActionCreators.openAlert(
        'plugin-reload-required',
        <PluginReloadRequiredAlert plugins={plugins} />,
    )
}

pEmitter.on(
    'flagUpdate',
    debounce(plugin => {
        if (plugin.flags & PluginFlags.ReloadRequired)
            showReloadRequiredAlertIfNeeded()
    }, 500),
)
showReloadRequiredAlertIfNeeded()

function PluginReloadRequiredAlert({ plugins }: { plugins: AnyPlugin[] }) {
    return (
        <AlertModal
            title="Reload Required"
            content={
                <Text variant="text-md/medium" color="header-secondary">
                    The following plugins require a reload to apply changes:
                    {'\n'}
                    {plugins.map((plugin, index) => (
                        <>
                            {index ? ', ' : null}
                            <Text
                                key={plugin.manifest.id}
                                variant="text-md/bold"
                                color="text-normal"
                            >
                                {plugin.manifest.name}
                            </Text>
                        </>
                    ))}
                </Text>
            }
            actions={
                <>
                    <AlertActionButton
                        variant="destructive"
                        text="Reload"
                        onPress={() => {
                            BundleUpdaterManager.reload()
                        }}
                    />
                    <AlertActionButton variant="secondary" text="Not now" />
                </>
            }
        />
    )
}
