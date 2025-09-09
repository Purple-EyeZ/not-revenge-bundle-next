import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { AlertActionCreators } from '@revenge-mod/discord/actions'
import { Design } from '@revenge-mod/discord/design'
import { BundleUpdaterManager } from '@revenge-mod/discord/native'
import { isPluginEnabled, pEmitter, pList } from '@revenge-mod/plugins/_'
import { PluginFlags } from '@revenge-mod/plugins/constants'
import { debounce } from '@revenge-mod/utils/callback'
import { useReRender } from '@revenge-mod/utils/react'
import { useEffect } from 'react'
import { RouteNames, Setting } from '../constants'
import defer * as RevengePluginsSettingScreen from '../screens/RevengePluginsSettingScreen'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'
import type { AnyPlugin } from '@revenge-mod/plugins/_'

const RevengePluginsSetting: SettingsItem = {
    parent: null,
    type: 'route',
    IconComponent: () => <TableRowAssetIcon name="PuzzlePieceIcon" />,
    title: () => 'Plugins',
    useTrailing: () => `${useEnabledPluginCount()} enabled`,
    screen: {
        route: RouteNames[Setting.RevengePlugins],
        getComponent: () => RevengePluginsSettingScreen.default,
    },
}

let enabledCount = 0

for (const plugin of pList.values()) if (isPluginEnabled(plugin)) enabledCount++

pEmitter.on('disabled', () => {
    enabledCount--
})

pEmitter.on('enabled', () => {
    enabledCount++
})

function useEnabledPluginCount() {
    const reRender = useReRender()

    useEffect(() => {
        pEmitter.on('disabled', reRender)
        pEmitter.on('enabled', reRender)

        return () => {
            pEmitter.off('disabled', reRender)
            pEmitter.off('enabled', reRender)
        }
    }, [reRender])

    return enabledCount
}

const { AlertActionButton, AlertModal, Text } = Design

pEmitter.on(
    'flagUpdate',
    debounce(function showReloadRequiredAlertIfNeeded(plugin: AnyPlugin) {
        if (plugin.flags & PluginFlags.ReloadRequired) {
            const plugins = [...pList.values()].filter(
                plugin => plugin.flags & PluginFlags.ReloadRequired,
            )

            AlertActionCreators.openAlert(
                'plugin-reload-required',
                <PluginReloadRequiredAlert plugins={plugins} />,
            )
        }
    }, 500),
)

function PluginReloadRequiredAlert({ plugins }: { plugins: AnyPlugin[] }) {
    return (
        <AlertModal
            title="Reload required"
            content={
                <Text variant="text-md/medium" color="header-secondary">
                    The following plugins require a reload to apply changes:
                    {'\n'}
                    {plugins.map((plugin, index) => (
                        <>
                            {index ? ' ,' : null}
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

export default RevengePluginsSetting
