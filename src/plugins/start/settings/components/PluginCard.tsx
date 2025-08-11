import { useNavigation } from '@react-navigation/native'
import { getAssetIdByName } from '@revenge-mod/assets'
import { styles } from '@revenge-mod/components/_'
import FormSwitch from '@revenge-mod/components/FormSwitch'
import { AlertActionCreators } from '@revenge-mod/discord/actions'
import { Tokens } from '@revenge-mod/discord/common'
import { Design } from '@revenge-mod/discord/design'
import {
    enablePlugin,
    getPluginDependencies,
    isPluginEnabled,
    isPluginEssential,
    runPluginLate,
} from '@revenge-mod/plugins/_'
import { memo } from 'react'
import {
    Image,
    PixelRatio,
    Pressable,
    useWindowDimensions,
    View,
} from 'react-native'
import { PluginFlashList } from './PluginList'
import PluginStatesProvider, { usePluginEnabled } from './PluginStateProvider'
import {
    enableTooltipTarget,
    essentialTooltipTarget,
    setEnablePluginTooltipVisible,
    setEssentialPluginTooltipVisible,
    useClickOutsideTooltip,
} from './TooltipProvider'
import type { AnyPlugin, InternalPluginMeta } from '@revenge-mod/plugins/_'

const { Card, Text, Stack, IconButton, createStyles } = Design

const PuzzlePieceIcon = getAssetIdByName('PuzzlePieceIcon', 'png')!
const SettingsIcon = getAssetIdByName('SettingsIcon', 'png')!

export const PLUGIN_CARD_ESTIMATED_SIZE = 116

export const PluginCard = memo(function PluginCard({
    name,
    description,
    author,
    icon,
    actions,
    rowEnd,
    columnEnd,
}: {
    name: string
    description: string
    author: string
    icon?: string
    actions?: React.ReactNode
    rowEnd?: boolean
    columnEnd?: boolean
}) {
    const styles_ = usePluginCardStyles()

    return (
        <Card
            style={[
                styles_.card,
                styles.grow,
                columnEnd && styles_.columnEnd,
                rowEnd && styles_.rowEnd,
            ]}
        >
            <Stack
                direction="horizontal"
                style={[styles.grow, styles_.topContainer]}
            >
                <Stack
                    direction="horizontal"
                    spacing={8}
                    style={[styles_.topContainer, styles.flex]}
                >
                    <Image
                        source={icon ? getAssetIdByName(icon) : PuzzlePieceIcon}
                        style={styles_.icon}
                    />
                    <Text
                        variant="heading-lg/semibold"
                        textBreakStrategy="balanced"
                        style={styles.flex}
                    >
                        {name}
                    </Text>
                </Stack>
                {actions}
            </Stack>
            <Stack spacing={4} style={[styles_.alignedContainer, styles.grow]}>
                <Text
                    color="text-muted"
                    style={styles.grow}
                    variant="heading-md/medium"
                >
                    by {author}
                </Text>
                <Text style={styles.grow} variant="text-md/medium">
                    {description}
                </Text>
            </Stack>
        </Card>
    )
})

export const InstalledPluginCard = memo(function InstalledPluginCard({
    plugin,
    meta,
    rowEnd,
    columnEnd,
}: {
    plugin: AnyPlugin
    meta: InternalPluginMeta
    rowEnd?: boolean
    columnEnd?: boolean
}) {
    const navigation = useNavigation()
    const enabled = usePluginEnabled(plugin)

    const {
        manifest: { name, description, author, icon },
    } = plugin

    const dependencies = getPluginDependencies(plugin)
    const essential = isPluginEssential(meta)
    const { dependents } = meta

    const settingsRef = useClickOutsideTooltip(enableTooltipTarget, () => {
        setEnablePluginTooltipVisible?.(false)
    })

    const switchRef = useClickOutsideTooltip(essentialTooltipTarget, () => {
        setEssentialPluginTooltipVisible?.(false)
    })

    return (
        <PluginCard
            name={name}
            description={description}
            author={author}
            icon={icon}
            rowEnd={rowEnd}
            columnEnd={columnEnd}
            actions={
                <>
                    {plugin.SettingsComponent && (
                        <Pressable
                            onPress={e => {
                                if (enabled) return

                                e.stopPropagation()

                                requestAnimationFrame(() => {
                                    enableTooltipTarget.current =
                                        settingsRef.current
                                    setEnablePluginTooltipVisible!(true)
                                })
                            }}
                        >
                            <IconButton
                                ref={settingsRef}
                                size="sm"
                                variant="secondary"
                                icon={SettingsIcon}
                                onPress={() => {
                                    navigation.navigate(plugin.manifest.id)
                                }}
                                disabled={!enabled}
                            />
                        </Pressable>
                    )}
                    <Pressable
                        onPress={e => {
                            if (essential) {
                                e.stopPropagation()

                                requestAnimationFrame(() => {
                                    essentialTooltipTarget.current =
                                        switchRef.current
                                    setEssentialPluginTooltipVisible!(true)
                                })
                            }
                        }}
                        ref={switchRef}
                    >
                        <FormSwitch
                            disabled={essential}
                            onValueChange={enabled => {
                                if (enabled)
                                    return handleEnablePlugin(
                                        plugin,
                                        dependencies,
                                    )
                                else
                                    return handleDisablePlugin(
                                        plugin,
                                        dependents,
                                    )
                            }}
                            value={enabled}
                        />
                    </Pressable>
                </>
            }
        />
    )
})

async function handleEnablePlugin(
    plugin: AnyPlugin,
    dependencies: AnyPlugin[],
) {
    const disabledDeps = dependencies.filter(dep => !isPluginEnabled(dep))

    async function action() {
        await enablePlugin(plugin)
        await runPluginLate(plugin)
    }

    if (disabledDeps.length)
        AlertActionCreators.openAlert(
            'plugin-has-dependencies',
            <PluginStatesProvider>
                <PluginHasDependenciesAlert
                    plugin={plugin}
                    dependencies={disabledDeps}
                    action={action}
                />
            </PluginStatesProvider>,
        )
    else await action()
}

async function handleDisablePlugin(plugin: AnyPlugin, dependents: AnyPlugin[]) {
    const action = plugin.disable

    const enabledDeps = dependents.filter(isPluginEnabled)

    if (enabledDeps.length)
        AlertActionCreators.openAlert(
            'plugin-has-dependents',
            <PluginStatesProvider>
                <PluginHasDependentsAlert
                    plugin={plugin}
                    dependents={enabledDeps}
                    action={action}
                />
            </PluginStatesProvider>,
        )
    else await action()
}

function PluginHasDependenciesAlert({
    plugin,
    dependencies,
    action,
}: {
    plugin: AnyPlugin
    dependencies: AnyPlugin[]
    action: () => Promise<void>
}) {
    const { height: windowHeight } = useWindowDimensions()
    const maxHeight = PixelRatio.get() * windowHeight * 0.35 - 64

    return (
        <Design.AlertModal
            title="Plugin has dependencies"
            content={
                <Text color="header-secondary">
                    Plugin{' '}
                    <Text variant="text-md/semibold" color="text-normal">
                        {plugin.manifest.name}
                    </Text>{' '}
                    depends on other plugins to function.
                    {'\n'}
                    Enabling it will also enable the following plugins:
                </Text>
            }
            extraContent={
                <View
                    style={{
                        height: Math.min(
                            PLUGIN_CARD_ESTIMATED_SIZE * dependencies.length,
                            maxHeight,
                        ),
                        maxHeight,
                    }}
                >
                    <PluginFlashList plugins={dependencies} />
                </View>
            }
            actions={
                <>
                    <Design.AlertActionButton
                        onPress={action}
                        text="Enable all"
                        variant="primary"
                    />
                    <Design.AlertActionButton
                        text="Cancel"
                        variant="secondary"
                    />
                </>
            }
        />
    )
}

function PluginHasDependentsAlert({
    plugin,
    dependents,
    action,
}: {
    plugin: AnyPlugin
    dependents: AnyPlugin[]
    action: () => Promise<void>
}) {
    const { height: windowHeight } = useWindowDimensions()
    const maxHeight = PixelRatio.get() * windowHeight * 0.35 - 64

    return (
        <Design.AlertModal
            title="Plugin has dependents"
            content={
                <Text color="header-secondary">
                    Other plugins depend on{' '}
                    <Text variant="text-md/semibold" color="text-normal">
                        {plugin.manifest.name}
                    </Text>{' '}
                    to function.
                    {'\n'}
                    Disabling it will also disable the following plugins:
                </Text>
            }
            extraContent={
                <View
                    style={{
                        height: Math.min(
                            PLUGIN_CARD_ESTIMATED_SIZE * dependents.length,
                            maxHeight,
                        ),
                        maxHeight,
                    }}
                >
                    <PluginFlashList plugins={dependents} />
                </View>
            }
            actions={
                <>
                    <Design.AlertActionButton
                        text="Disable all"
                        variant="destructive"
                        onPress={action}
                    />
                    <Design.AlertActionButton
                        text="Cancel"
                        variant="secondary"
                    />
                </>
            }
        />
    )
}

const usePluginCardStyles = createStyles({
    icon: {
        width: 20,
        height: 20,
        tintColor: Tokens.default.colors.TEXT_NORMAL,
    },
    card: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        gap: 4,
        marginBottom: 12,
        marginRight: 12,
    },
    rowEnd: {
        marginBottom: 0,
    },
    columnEnd: {
        marginRight: 0,
    },
    topContainer: {
        alignItems: 'center',
    },
    alignedContainer: {
        paddingLeft: 28,
    },
})
