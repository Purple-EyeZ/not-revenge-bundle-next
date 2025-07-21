import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { registerSettingsItem } from '@revenge-mod/discord/modules/settings'
import { pEmitter } from '@revenge-mod/plugins/_'
import { proxify } from '@revenge-mod/utils/proxy'
import { useLayoutEffect } from 'react'
import { Setting } from './constants'
import type { StackScreenProps } from '@react-navigation/stack'
import type { ReactNavigationParamList } from '@revenge-mod/externals/react-navigation'
import type { PluginApi } from '@revenge-mod/plugins/types'

type NavigatorHeaderWithIcon =
    typeof import('./components/NavigatorHeaderWithIcon')['default']

let NavigatorHeaderWithIcon = proxify(
    (): NavigatorHeaderWithIcon =>
        (NavigatorHeaderWithIcon =
            require('./components/NavigatorHeaderWithIcon').default),
    {},
)

pEmitter.on('started', plugin => {
    if (plugin.SettingsComponent) {
        const api = plugin.api as PluginApi<any>

        function PluginSettings({
            navigation,
        }: StackScreenProps<ReactNavigationParamList>) {
            const SC = plugin.SettingsComponent!

            // biome-ignore lint/correctness/useExhaustiveDependencies: We only want to set options once
            useLayoutEffect(() => {
                if (plugin.manifest.icon)
                    navigation.setOptions({
                        headerTitle: () => (
                            <NavigatorHeaderWithIcon
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

            return <SC api={api} />
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
            // TODO(PalmDevs): In the future, we may allow pinning plugin settings, so we'll need this cleanup
            // () => refreshSettingsOverviewScreen(),
        )
    }
})
