import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { Setting } from '../constants'
import { CopyableSetting } from './shared'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

const { 'OSS Release Version': ossReleaseVersion } =
    // @ts-expect-error
    HermesInternal.getRuntimeProperties()

const ReactNativeVersionSetting: SettingsItem = CopyableSetting(
    {
        parent: Setting.Revenge,
        IconComponent: () => <TableRowAssetIcon name="ScienceIcon" />,
        title: () => 'React Native',
    },
    // slice "for RN " off the version string
    () => ossReleaseVersion.slice(7),
)

export default ReactNativeVersionSetting
