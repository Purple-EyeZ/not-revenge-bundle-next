import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { RouteNames, Setting } from '../constants'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

const RevengeThemesSetting: SettingsItem = {
    parent: null,
    type: 'route',
    IconComponent: () => <TableRowAssetIcon name="PaintPaletteIcon" />,
    title: () => 'Themes',
    screen: {
        route: RouteNames[Setting.RevengeThemes],
        getComponent: () =>
            require('../screens/RevengeThemesSettingScreen').default,
    },
}

export default RevengeThemesSetting
