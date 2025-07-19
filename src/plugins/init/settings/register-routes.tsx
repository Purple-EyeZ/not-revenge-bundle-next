import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { registerSettingsItem } from '@revenge-mod/discord/modules/settings'
import { pEmitter, pMetadata } from '@revenge-mod/plugins/_'
import { lazy, useLayoutEffect } from 'react'
import { Setting } from './constants'
import type { StackScreenProps } from '@react-navigation/stack'
import type { ReactNavigationParamList } from '@revenge-mod/externals/react-navigation'
import type { PluginApi } from '@revenge-mod/plugins/types'

const NavigatorHeaderWithIcon = lazy(
    () => import('./components/NavigatorHeaderWithIcon'),
)

pEmitter.on('started', plugin => {
    if (plugin.SettingsComponent) {
        const api = pMetadata.get(plugin.manifest.id)!.api as PluginApi<any>

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
