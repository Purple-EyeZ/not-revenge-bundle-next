import {
    sConfig,
    sData,
    sSections,
    sSubscriptions,
} from '@revenge-mod/discord/_/modules/settings'
import { onSettingsModulesLoaded } from '@revenge-mod/discord/modules/settings'
import { byName, byProps } from '@revenge-mod/modules/finders/filters'
import { waitForModules } from '@revenge-mod/modules/finders/wait'
import { after } from '@revenge-mod/patcher'
import { InternalPluginFlags, registerPlugin } from '@revenge-mod/plugins/_'
import { PluginFlags } from '@revenge-mod/plugins/constants'
import type { SettingsItem } from '@revenge-mod/discord/modules/settings'
import type { FC } from 'react'

import './routes'

onSettingsModulesLoaded(() => {
    require('./register')
})

registerPlugin(
    {
        id: 'revenge.settings',
        name: 'Settings',
        description: 'Settings UI for Revenge.',
        author: 'Revenge',
        icon: 'SettingsIcon',
    },
    {
        start({ logger }) {
            const unsubRC = waitForModules(
                byProps<{
                    SETTING_RENDERER_CONFIG: Record<string, SettingsItem>
                }>('SETTING_RENDERER_CONFIG'),
                SettingRendererConfig => {
                    unsubRC()

                    logger.info(
                        'Settings modules loaded, running subscriptions and patching...',
                    )

                    for (const sub of sSubscriptions)
                        try {
                            sub()
                        } catch (e) {
                            logger.error(
                                'Failed to run settings modules subscription',
                                e,
                            )
                        }

                    // We don't ever need to call this again
                    sSubscriptions.clear()
                    sData.loaded = true

                    let ORIGINAL_RENDERER_CONFIG =
                        SettingRendererConfig.SETTING_RENDERER_CONFIG

                    Object.defineProperty(
                        SettingRendererConfig,
                        'SETTING_RENDERER_CONFIG',
                        {
                            get: () =>
                                ({
                                    ...ORIGINAL_RENDERER_CONFIG,
                                    ...sConfig,
                                }) as Record<string, SettingsItem>,
                            set: v => (ORIGINAL_RENDERER_CONFIG = v),
                        },
                    )
                },
            )

            const unsubSOS = waitForModules(
                byName('SettingsOverviewScreen'),
                exports => {
                    unsubSOS()

                    const customSections = sSections

                    after(exports as { default: FC }, 'default', tree => {
                        const {
                            props: { sections },
                        } = tree as {
                            props: {
                                sections: Array<{
                                    label: string
                                    settings: string[]
                                }>
                            }
                        }

                        // Check if we even have custom sections
                        const firstCustomSection =
                            customSections[Object.keys(customSections)[0]]
                        if (!firstCustomSection) return tree

                        // Check if sections are already spliced
                        const firstCustomItem = firstCustomSection.settings[0]
                        if (
                            sections.findIndex(section =>
                                section.settings.some(
                                    setting => setting === firstCustomItem,
                                ),
                            ) !== -1
                        )
                            return tree

                        for (const section of Object.values(customSections))
                            if (!section.index) sections.unshift(section)
                            else sections.splice(section.index, 0, section)

                        return tree
                    })
                },
                {
                    returnNamespace: true,
                },
            )
        },
    },
    PluginFlags.Enabled,
    InternalPluginFlags.Internal | InternalPluginFlags.Essential,
)
