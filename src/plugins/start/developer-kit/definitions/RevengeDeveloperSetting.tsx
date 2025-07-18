import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { RouteNames, Setting } from '../constants'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

const RevengeDeveloperSetting: SettingsItem = {
    parent: null,
    type: 'route',
    IconComponent: () => <TableRowAssetIcon name="WrenchIcon" />,
    title: () => 'Developer',
    screen: {
        route: RouteNames[Setting.RevengeDeveloper],
        getComponent: () =>
            require('../screens/RevengeDeveloperSettingScreen').default,
    },
}

export default RevengeDeveloperSetting
