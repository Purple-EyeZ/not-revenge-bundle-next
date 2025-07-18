import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { api } from '..'
import { Setting } from '../constants'
import { RDTContext } from '../react-devtools'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

const RDTAutoConnectSetting: SettingsItem = {
    parent: Setting.RevengeDeveloper,
    IconComponent: () => <TableRowAssetIcon name="LinkIcon" />,
    title: () => 'Auto-connect to React DevTools',
    useDescription: () =>
        'Automatically connect to React DevTools during startup.',
    usePredicate: () => RDTContext.active,
    useValue: () =>
        api.storage.use(s => s.devtools?.autoConnect !== undefined)!.devtools
            .autoConnect,
    onValueChange: v => {
        api.storage.set({ devtools: { autoConnect: v } })
    },
    type: 'toggle',
}

export default RDTAutoConnectSetting
