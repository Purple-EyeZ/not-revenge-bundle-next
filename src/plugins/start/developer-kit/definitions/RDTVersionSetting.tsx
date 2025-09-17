import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { CopyableSetting } from '~/plugins/start/settings/definitions/shared'
import { Setting } from '../constants'
import { RDTContext } from '../react-devtools'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

const RDTVersionSetting: SettingsItem = CopyableSetting(
    {
        parent: Setting.RevengeDeveloper,
        IconComponent: () => <TableRowAssetIcon name="ScienceIcon" />,
        title: () => 'React DevTools',
        usePredicate: () => RDTContext.active,
    },
    () => String(globalThis.__REACT_DEVTOOLS__!.version),
)

export default RDTVersionSetting
