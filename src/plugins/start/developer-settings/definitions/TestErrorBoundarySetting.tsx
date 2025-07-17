import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { RouteNames, Setting } from '../constants'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

const TestErrorBoundarySetting: SettingsItem = {
    parent: Setting.RevengeDeveloper,
    type: 'route',
    variant: 'danger',
    IconComponent: () => (
        <TableRowAssetIcon name="CircleXIcon" variant="danger" />
    ),
    title: () => 'Test ErrorBoundary',
    screen: {
        route: RouteNames[Setting.TestErrorBoundary],
        getComponent: () =>
            require('../screens/TestErrorBoundarySettingScreen').default,
    },
}

export default TestErrorBoundarySetting
