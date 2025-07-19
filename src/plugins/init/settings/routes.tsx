import { getAssetIdByName } from '@revenge-mod/assets'
import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { Tokens } from '@revenge-mod/discord/common'
import { Stores } from '@revenge-mod/discord/common/flux'
import { Design } from '@revenge-mod/discord/design'
import { registerSettingsItem } from '@revenge-mod/discord/modules/settings'
import { pEmitter, pMetadata } from '@revenge-mod/plugins/_'
import { useLayoutEffect } from 'react'
import { Image } from 'react-native'
import { Setting } from './constants'
import type { StackScreenProps } from '@react-navigation/stack'
import type { DiscordModules } from '@revenge-mod/discord/types'
import type { ReactNavigationParamList } from '@revenge-mod/externals/react-navigation'
import type { PluginApi } from '@revenge-mod/plugins/types'

const { NavigatorHeader } = Design
const { default: tokens } = Tokens

const ThemeStore = Stores.ThemeStore as DiscordModules.Flux.Store<{
    theme: string
}>

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
        )
    }
})

function NavigatorHeaderWithIcon({
    title,
    icon,
}: {
    title: string
    icon?: string
}) {
    return (
        <NavigatorHeader
            icon={
                <Image
                    style={{
                        width: 24,
                        height: 24,
                        marginEnd: 8,
                        tintColor: tokens.internal.resolveSemanticColor(
                            ThemeStore.theme,
                            tokens.colors.HEADER_PRIMARY,
                        ),
                    }}
                    source={getAssetIdByName(icon!)}
                />
            }
            title={title}
        />
    )
}
