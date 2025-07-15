import Page from '@revenge-mod/components/Page'
import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { Design } from '@revenge-mod/discord/design'
import { byProps } from '@revenge-mod/modules/finders/filters'
import { getModule } from '@revenge-mod/modules/finders/get'
import { instead } from '@revenge-mod/patcher'
import { registerPlugin } from '@revenge-mod/plugins/_'
import { ScrollView } from 'react-native'

interface Storage {
    autoConfirmMessage: boolean
    autoConfirmEmbed: boolean
}

const defaultStorage: Storage = {
    autoConfirmMessage: true,
    autoConfirmEmbed: true,
}

let settingsCache: Storage = { ...defaultStorage }

const deletionConfigs = {
    message: {
        translationKey: 'AMvpS0',
        storageKey: 'autoConfirmMessage' as const,
    },
    embed: {
        translationKey: 'vXZ+Fh',
        storageKey: 'autoConfirmEmbed' as const,
    },
}

registerPlugin<{ storage: Storage }>(
    {
        id: 'purpleeyez.quickdelete',
        name: 'Quick Delete',
        author: 'Purple_Ξye™',
        description: 'Remove confirmation when deleting a message or an embed.',
        icon: 'TrashIcon',
    },
    {
        storage: {
            load: true,
            default: defaultStorage,
        },

        start({ cleanup, logger, storage }) {
            storage.get().then(s => (settingsCache = s))

            const unsubIntl = getModule(
                byProps('intl', 't'),
                ({ intl, t: intlMap }) => {
                    const unsubPopup = getModule(
                        byProps('show', 'openLazy'),
                        Popup => {
                            logger.info('Popup module found, patching...')
                            cleanup(
                                instead(
                                    Popup,
                                    'show',
                                    ([popup], original) => {
                                        const title = popup?.children?.props?.title
                                        const body = popup?.body

                                        const titleOrBody = [
                                            typeof title === 'string'
                                                ? title.trim()
                                                : undefined,
                                            typeof body === 'string'
                                                ? body.trim()
                                                : undefined,
                                        ]

                                        for (const config of Object.values(deletionConfigs)) {

                                            if (settingsCache[config.storageKey]) {
                                                const translation = intl.string(intlMap[config.translationKey])
                                                if (translation && titleOrBody.includes( translation )) {
                                                    popup.onConfirm?.()
                                                    return
                                                }
                                            }
                                        }

                                        return original.call(Popup, popup)
                                    },
                                ),
                            )
                        },
                    )
                    cleanup(unsubPopup)
                },
            )
            cleanup(unsubIntl)
        },

        SettingsComponent({ api }) {
            const { TableRowGroup, TableSwitchRow } = Design

            const settings = api.storage.use(s => s)

            if (!settings) {
                return null
            }

            const updateSetting = (key: keyof Storage, value: boolean) => {
                const newSettings = { [key]: value }
                api.storage.set(newSettings)
                Object.assign(settingsCache, newSettings)
            }

            return (
                <ScrollView>
                    <Page spacing={16}>
                        <TableRowGroup title="Settings">
                            <TableSwitchRow
                                label="Messages"
                                subLabel="Deletes messages without confirmation"
                                icon={<TableRowAssetIcon name="ForumIcon" />}
                                value={settings.autoConfirmMessage}
                                onValueChange={v =>
                                    updateSetting('autoConfirmMessage', v)
                                }
                            />
                            <TableSwitchRow
                                label="Embeds"
                                subLabel="Deletes embeds without confirmation"
                                icon={<TableRowAssetIcon name="EmbedIcon" />}
                                value={settings.autoConfirmEmbed}
                                onValueChange={v =>
                                    updateSetting('autoConfirmEmbed', v)
                                }
                            />
                        </TableRowGroup>
                    </Page>
                </ScrollView>
            )
        },
    },
    1,
    0,
)
