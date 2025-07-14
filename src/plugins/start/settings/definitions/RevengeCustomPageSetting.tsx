import { RouteNames, Setting } from '../constants'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

const RevengeCustomPageSetting: SettingsItem = {
    parent: null,
    title: () => 'Revenge Custom Page',
    type: 'route',
    unsearchable: true,
    screen: {
        route: RouteNames[Setting.RevengeCustomPage],
        getComponent: () =>
            require('../screens/RevengeCustomPageScreen').default,
    },
}

export default RevengeCustomPageSetting
