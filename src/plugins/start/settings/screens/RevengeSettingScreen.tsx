import { Design } from '@revenge-mod/discord/design'
import { SettingListRenderer } from '@revenge-mod/discord/modules/settings/renderer'
import { Setting } from '../constants'

export default function RevengeSettingScreen() {
    return (
        <SettingListRenderer.SettingsList
            sections={[
                {
                    label: 'Revenge',
                    settings: [
                        Setting.RevengeVersion,
                        Setting.RevengeDiscord,
                        Setting.RevengeSourceRepository,
                        Setting.RevengeLicense,
                    ],
                    subLabel: (
                        <>
                            <Design.Text variant="text-xs/medium">
                                You are using the next version of Revenge!
                            </Design.Text>
                            <Design.Text
                                color="text-danger"
                                variant="text-xs/semibold"
                            >
                                This version is experimental and may be
                                unstable.
                            </Design.Text>
                        </>
                    ),
                },
                {
                    label: 'Versions',
                    settings: [
                        Setting.ReactVersion,
                        Setting.ReactNativeVersion,
                        Setting.HermesVersion,
                    ],
                },
                {
                    label: 'Actions',
                    settings: [Setting.Reload],
                },
            ]}
        />
    )
}
