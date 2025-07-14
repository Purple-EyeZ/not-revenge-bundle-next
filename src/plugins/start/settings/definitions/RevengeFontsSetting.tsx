import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { RouteNames, Setting } from '../constants'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

const RevengeFontsSetting: SettingsItem = {
    parent: null,
    type: 'route',
    IconComponent: () => <TableRowAssetIcon name="TextIcon" />,
    title: () => 'Fonts',
    screen: {
        route: RouteNames[Setting.RevengePlugins],
        getComponent: () =>
            require('../screens/RevengePluginsSettingScreen').default,
    },
}

export default RevengeFontsSetting
