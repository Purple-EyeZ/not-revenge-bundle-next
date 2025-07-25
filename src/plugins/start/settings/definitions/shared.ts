import { ToastActionCreators } from '@revenge-mod/discord/actions'
import { Clipboard } from '@revenge-mod/externals/react-native-clipboard'
import { lookupGeneratedIconComponent } from '@revenge-mod/utils/discord'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'

const CopyIcon = lookupGeneratedIconComponent('CopyIcon')

export const CopyableSetting = (
    item: Omit<SettingsItem, 'type' | 'onClick'>,
    description: () => string,
): SettingsItem => ({
    ...item,
    useDescription: item.useDescription ?? (() => description()),
    type: 'pressable',
    onPress() {
        Clipboard.setString(description())
        ToastActionCreators.open({
            key: 'REVENGE_SETTING_COPIED',
            content: 'Copied to clipboard',
            IconComponent: CopyIcon,
        })
    },
})
