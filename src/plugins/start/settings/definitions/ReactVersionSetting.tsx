import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { version } from 'react'
import { Setting } from '../constants'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

const ReactVersionSetting: SettingsItem = {
    parent: Setting.Revenge,
    IconComponent: () => <TableRowAssetIcon name="ScienceIcon" />,
    title: () => 'React',
    useDescription: () => version,
    type: 'static',
}

export default ReactVersionSetting
