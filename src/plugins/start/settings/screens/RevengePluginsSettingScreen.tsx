import { useNavigation, useRoute } from '@react-navigation/native'
import { getAssetIdByName } from '@revenge-mod/assets'
import { styles } from '@revenge-mod/components/_'
import Page from '@revenge-mod/components/Page'
import SearchInput from '@revenge-mod/components/SearchInput'
import { ActionSheetActionCreators } from '@revenge-mod/discord/actions'
import { Design } from '@revenge-mod/discord/design'
import {
    InternalPluginFlags,
    isPluginEnabled,
    isPluginEssential,
    isPluginInternal,
    pList,
    pMetadata,
} from '@revenge-mod/plugins/_'
import { PluginFlags } from '@revenge-mod/plugins/constants'
import { debounce } from '@revenge-mod/utils/callback'
import { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { ClickOutsideProvider } from 'react-native-click-outside'
import RevengeIcon from '~assets/RevengeIcon'
import { InstalledPluginMasonryFlashList } from '../components/PluginList'
import PluginStatesProvider from '../components/PluginStateProvider'
import {
    EnablePluginTooltipProvider,
    EssentialPluginTooltipProvider,
} from '../components/TooltipProvider'
import type { RouteProp } from '@react-navigation/core'
import type { ReactNavigationParamList } from '@revenge-mod/externals/react-navigation'
import type { FilterAndSortActionSheetProps } from '../components/FilterAndSortActionSheet'
import type { RouteNames, Setting } from '../constants'

const { Stack, IconButton, LayerScope } = Design

const FiltersHorizontalIcon = getAssetIdByName('FiltersHorizontalIcon', 'png')!

export default function RevengePluginsSettingScreen() {
    return (
        <LayerScope>
            <ClickOutsideProvider>
                <PluginStatesProvider>
                    <Page spacing={16}>
                        <EssentialPluginTooltipProvider>
                            <EnablePluginTooltipProvider>
                                <Screen />
                            </EnablePluginTooltipProvider>
                        </EssentialPluginTooltipProvider>
                    </Page>
                </PluginStatesProvider>
            </ClickOutsideProvider>
        </LayerScope>
    )
}

const SearchDebounceTime = 100

const Filters: FilterAndSortActionSheetProps['filters'] = {
    Enabled: {
        icon: getAssetIdByName('CircleCheckIcon')!,
        filter: plugin => isPluginEnabled(plugin),
    },
    Disabled: {
        icon: getAssetIdByName('CircleXIcon')!,
        filter: plugin => !isPluginEnabled(plugin),
    },
    Internal: {
        icon: RevengeIcon,
        desc: 'Included with Revenge.',
        filter: (_, meta) => isPluginInternal(meta),
    },
    Essential: {
        icon: getAssetIdByName('StarIcon')!,
        desc: 'Required for Revenge to function properly.',
        filter: (_, meta) => isPluginEssential(meta),
    },
    'Non-APIs': {
        icon: getAssetIdByName('PaperIcon')!,
        desc: 'Exclude essential plugins that provide APIs for other plugins.',
        filter: (_, meta) =>
            !(meta.iflags & InternalPluginFlags.ImplicitDependency),
    },
} satisfies FilterAndSortActionSheetProps['filters']
const DefaultFilters: FilterAndSortActionSheetProps['filter'] = ['Non-APIs']

const DefaultSort: keyof typeof Sorts = 'Name'
const Sorts = {
    Name: [
        getAssetIdByName('IdIcon')!,
        (a, b) => a.manifest.name.localeCompare(b.manifest.name),
    ],
    'Enabled first': [
        getAssetIdByName('CircleCheckIcon')!,
        (a, b) =>
            (b.flags & PluginFlags.Enabled) - (a.flags & PluginFlags.Enabled),
    ],
} satisfies FilterAndSortActionSheetProps['sorts']

function Screen() {
    const navigation = useNavigation()
    const route =
        useRoute<
            RouteProp<
                ReactNavigationParamList,
                (typeof RouteNames)[typeof Setting.RevengePlugins]
            >
        >()

    const [search, setSearch] = useState('')
    const debouncedSetSearch = useCallback(
        debounce(setSearch, SearchDebounceTime),
        [],
    )

    const [filter, setFilter] = useState(route.params?.filter ?? DefaultFilters)
    const [matchAll, setMatchAll] = useState(route.params?.matchAll ?? true)

    const [reverse, setReverse] = useState(route.params?.reverse ?? false)
    const [sort, setSort] = useState(route.params?.sort ?? DefaultSort)

    const allPlugins = useMemo(
        () =>
            [...pList.values()].map(
                plugin => [plugin, pMetadata.get(plugin)!] as const,
            ),
        [],
    )

    const plugins = allPlugins
        .filter(([plugin, meta]) => {
            if (filter.length === 0) return true
            if (matchAll)
                return filter.every(f => Filters[f].filter(plugin, meta))

            return filter.some(f => Filters[f].filter(plugin, meta))
        })
        .filter(([plugin]) => {
            const { name, description, author } = plugin.manifest
            const query = search.toLowerCase()
            return (
                name.toLowerCase().includes(query) ||
                description.toLowerCase().includes(query) ||
                author.toLowerCase().includes(query)
            )
        })
        .sort(([a], [b]) => {
            const result = Sorts[sort as keyof typeof Sorts][1](a, b)
            return reverse ? -result : result
        })

    return (
        <>
            <Stack direction="horizontal">
                <View style={styles.grow}>
                    <SearchInput
                        onChange={(v: string) => {
                            debouncedSetSearch(v)
                        }}
                        size="md"
                    />
                </View>
                <IconButton
                    icon={FiltersHorizontalIcon}
                    variant="tertiary"
                    onPress={() =>
                        ActionSheetActionCreators.openLazy(
                            import('../components/FilterAndSortActionSheet'),
                            'filter-and-sort-plugins',
                            {
                                filters: Filters,
                                filter,
                                setFilter: filter => {
                                    navigation.setParams({ filter })
                                    setFilter(filter)
                                },
                                matchAll,
                                setMatchAll: matchAll => {
                                    navigation.setParams({ matchAll })
                                    setMatchAll(matchAll)
                                },
                                reverse,
                                setReverse: reverse => {
                                    navigation.setParams({ reverse })
                                    setReverse(reverse)
                                },
                                sorts: Sorts,
                                sort,
                                setSort: sort => {
                                    navigation.setParams({ sort })
                                    setSort(sort)
                                },
                            },
                        )
                    }
                />
            </Stack>
            <InstalledPluginMasonryFlashList plugins={plugins} />
        </>
    )
}
