import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { BuildEnvironment, FullVersion } from '~/constants'
import RevengeIcon from '~assets/RevengeIcon'
import { Setting } from '../constants'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

const RevengeVersionSetting: SettingsItem = {
    parent: Setting.Revenge,
    IconComponent: () => <TableRowAssetIcon id={RevengeIcon} />,
    title: () => 'Revenge',
    useDescription: () => `${FullVersion} (${BuildEnvironment})`,
    type: 'static',
}

export default RevengeVersionSetting
