import { SettingListRenderer } from '@revenge-mod/discord/modules/settings/renderer'

export default function RevengeThemesSettingScreen() {
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
