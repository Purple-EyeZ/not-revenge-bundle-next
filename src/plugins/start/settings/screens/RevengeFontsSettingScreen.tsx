import { SettingListRenderer } from '@revenge-mod/discord/modules/settings/renderer'

export default function RevengeFontsSettingScreen() {
    return (
        <SettingListRenderer.SettingsList
            sections={[
                {
                    settings: [],
                },
            ]}
        />
    )
}
