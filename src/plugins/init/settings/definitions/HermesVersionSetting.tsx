import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { Setting } from '../constants'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

// @ts-expect-error
const props = HermesInternal.getRuntimeProperties()

const HermesVersionSetting: SettingsItem = {
    parent: Setting.Revenge,
    IconComponent: () => <TableRowAssetIcon name="TranscriptOutlineIcon" />,
    title: () => 'Hermes',
    useDescription: () => `${props['Bytecode Version']} (${props.Build})`,
    type: 'static',
}

export default HermesVersionSetting
