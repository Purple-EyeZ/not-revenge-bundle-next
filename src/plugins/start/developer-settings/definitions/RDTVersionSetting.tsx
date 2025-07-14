import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { Setting } from '../constants'
import { RDTContext } from '../react-devtools'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

const RDTVersionSetting: SettingsItem = {
    parent: Setting.RevengeDeveloper,
    IconComponent: () => <TableRowAssetIcon name="ScienceIcon" />,
    title: () => 'React DevTools',
    useDescription: () => __REACT_DEVTOOLS__!.version,
    usePredicate: () => RDTContext.active,
    type: 'static',
}

export default RDTVersionSetting
