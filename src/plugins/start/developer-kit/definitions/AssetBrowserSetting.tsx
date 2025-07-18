import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { RouteNames, Setting } from '../constants'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

const AssetBrowserSetting: SettingsItem = {
    parent: Setting.RevengeDeveloper,
    type: 'route',
    IconComponent: () => <TableRowAssetIcon name="ImageIcon" />,
    title: () => 'Asset Browser',
    screen: {
        route: RouteNames[Setting.AssetBrowser],
        getComponent: () =>
            require('../screens/AssetBrowserSettingScreen').default,
    },
}

export default AssetBrowserSetting
