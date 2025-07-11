import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { FullVersion } from '~/constants'
import RevengeIcon from '~assets/RevengeIcon'
import { RouteNames, Setting } from '../constants'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

const RevengeSetting: SettingsItem = {
    parent: null,
    type: 'route',
    IconComponent: () => <TableRowAssetIcon id={RevengeIcon} />,
    title: () => 'Revenge',
    useTrailing: () => FullVersion,
    screen: {
        route: RouteNames[Setting.Revenge],
        getComponent: () => require('../screens/RevengeSettingScreen').default,
    },
}

export default RevengeSetting
