import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { AlertActionCreators } from '@revenge-mod/discord/actions'
import { Design } from '@revenge-mod/discord/design'
import { BundleUpdaterManager } from '@revenge-mod/discord/native'
import { pEmitter, pList } from '@revenge-mod/plugins/_'
import { PluginFlags } from '@revenge-mod/plugins/constants'
import { useReRender } from '@revenge-mod/utils/react'
import { useEffect } from 'react'
import { RouteNames, Setting } from '../constants'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'
import type { InternalPlugin } from '@revenge-mod/plugins/_'

const RevengePluginsSetting: SettingsItem = {
    parent: null,
    type: 'route',
    IconComponent: () => <TableRowAssetIcon name="PuzzlePieceIcon" />,
    title: () => 'Plugins',
    useTrailing: () => {
        useUpdateOnPluginStatesChange()
        return `${enabledCount} enabled`
    },
    screen: {
        route: RouteNames[Setting.RevengePlugins],
        getComponent: () =>
            require('../screens/RevengePluginsSettingScreen').default,
    },
}

let enabledCount = 0

for (const plugin of pList.values())
    if (plugin.flags & PluginFlags.Enabled) enabledCount++

pEmitter.on('disabled', () => {
    enabledCount--
})

pEmitter.on('enabled', () => {
    enabledCount++
})

export function useUpdateOnPluginStatesChange() {
    const reRender = useReRender()

    useEffect(() => {
        pEmitter.on('disabled', reRender)
        pEmitter.on('enabled', reRender)

        return () => {
            pEmitter.off('disabled', reRender)
            pEmitter.off('enabled', reRender)
        }
    }, [reRender])
}

const { AlertActionButton, AlertModal, Text } = Design

pEmitter.on('started', showReloadRequiredAlertIfNeeded)
pEmitter.on('stopped', showReloadRequiredAlertIfNeeded)

function showReloadRequiredAlertIfNeeded(plugin: InternalPlugin) {
    if (plugin.flags & PluginFlags.ReloadRequired) {
        AlertActionCreators.openAlert(
            'plugin-reload-required',
            <AlertModal
                title="Reload required"
                content={
                    <Text variant="text-md/medium" color="header-secondary">
                        Plugin{' '}
                        <Text variant="text-md/bold" color="header-secondary">
                            {plugin.manifest.name}
                        </Text>{' '}
                        requires a reload to apply changes.
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
            />,
        )
    }
}

export default RevengePluginsSetting
