import { styles } from '@revenge-mod/components/_'
import { Design } from '@revenge-mod/discord/design'
import { FlashList, MasonryFlashList } from '@shopify/flash-list'
import { useWindowDimensions } from 'react-native'
import {
    InstalledPluginCard,
    PLUGIN_CARD_ESTIMATED_SIZE,
    PluginCard,
} from './PluginCard'
import { resetTooltips } from './TooltipProvider'
import type { AnyPlugin, InternalPluginMeta } from '@revenge-mod/plugins/_'

const { Text } = Design

export function PluginFlashList({ plugins }: { plugins: AnyPlugin[] }) {
    const { width, height } = useWindowDimensions()
    const actualWidth = width - styles.pagePadding.paddingHorizontal * 2

    return (
        <FlashList
            data={plugins}
            onScrollBeginDrag={resetTooltips}
            fadingEdgeLength={plugins.length === 1 ? 0 : 16}
            keyExtractor={plugin => plugin.manifest.id}
            estimatedItemSize={PLUGIN_CARD_ESTIMATED_SIZE}
            estimatedListSize={{ width: actualWidth, height }}
            renderItem={({
                item: {
                    manifest: { name, description, author, icon },
                },
                index,
            }) => (
                <PluginCard
                    name={name}
                    description={description}
                    author={author}
                    icon={icon}
                    rowEnd={index === plugins.length - 1}
                    columnEnd
                />
            )}
        />
    )
}

export function InstalledPluginMasonryFlashList({
    plugins,
}: {
    plugins: (readonly [AnyPlugin, InternalPluginMeta])[]
}) {
    const { width, height } = useWindowDimensions()
    const actualWidth = width - styles.pagePadding.paddingHorizontal * 2
    const numColumns = Math.floor(actualWidth / 448) || 1

    return (
        <MasonryFlashList
            contentContainerStyle={{ paddingBottom: 16 }}
            data={plugins}
            onScrollBeginDrag={resetTooltips}
            fadingEdgeLength={16}
            keyExtractor={([plugin]) => plugin.manifest.id}
            estimatedListSize={{ width: actualWidth, height }}
            estimatedItemSize={PLUGIN_CARD_ESTIMATED_SIZE}
            numColumns={numColumns}
            ListEmptyComponent={NoPlugins}
            renderItem={({ item: [plugin, meta], columnIndex, index }) => (
                <InstalledPluginCard
                    plugin={plugin}
                    meta={meta}
                    rowEnd={
                        index > plugins.length - numColumns &&
                        columnIndex <= plugins.length % numColumns
                    }
                    columnEnd={columnIndex === numColumns - 1}
                />
            )}
        />
    )
}

function NoPlugins() {
    return (
        <Text variant="heading-md/medium" style={{ textAlign: 'center' }}>
            No plugins found. Try changing your query or filters.
        </Text>
    )
}
