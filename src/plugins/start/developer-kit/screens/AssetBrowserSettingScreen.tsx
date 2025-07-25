import { getAssets } from '@revenge-mod/assets'
import Page from '@revenge-mod/components/Page'
import SearchInput from '@revenge-mod/components/SearchInput'
import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import {
    AlertActionCreators,
    ToastActionCreators,
} from '@revenge-mod/discord/actions'
import { Design } from '@revenge-mod/discord/design'
import { Clipboard } from '@revenge-mod/externals/react-native-clipboard'
import { debounce } from '@revenge-mod/utils/callback'
import { lookupGeneratedIconComponent } from '@revenge-mod/utils/discord'
import { FlashList } from '@shopify/flash-list'
import { useCallback, useMemo, useState } from 'react'
import { Image, StyleSheet, useWindowDimensions } from 'react-native'
import type { Asset, AssetId } from '@revenge-mod/assets/types'
import type { Metro } from '@revenge-mod/modules/types'

const { AlertModal, AlertActionButton, TableRow, TableRowGroup, Text } = Design

const Displayable = new Set(['png', 'jpg', 'svg', 'webp'])
const UndisplayableFallback = {
    jsona: 'ic_file_text',
    lottie: 'ic_image',
    webm: 'CirclePlayIcon-primary',
    ttf: 'ic_add_text',
    default: 'UnknownGameIcon',
}

export default function AssetBrowserSettingScreen() {
    const { width, height } = useWindowDimensions()
    const [search, setSearch] = useState('')
    const debouncedSetSearch = useCallback(debounce(setSearch, 100), [])
    const assets = useMemo(() => [...getAssets()], [])

    const filteredAssets = useMemo(
        () =>
            !search.length
                ? assets
                : assets.filter(asset =>
                      asset.name.toLowerCase().includes(search.toLowerCase()),
                  ),
        [assets, search],
    )

    return (
        <Page spacing={16}>
            <SearchInput
                onChange={(v: string) => {
                    debouncedSetSearch(v)
                }}
                size="md"
            />
            <FlashList
                data={filteredAssets}
                contentContainerStyle={styles.listContainer}
                fadingEdgeLength={32}
                estimatedListSize={{ width: width - 32, height: height - 160 }}
                estimatedItemSize={80}
                keyExtractor={asset =>
                    asset.id
                        ? asset.id.toString()
                        : `${asset.name}.${asset.type}`
                }
                renderItem={({ item: asset, index }) => (
                    <AssetDisplay
                        asset={asset}
                        end={index === filteredAssets.length - 1}
                        id={asset.id}
                        moduleId={asset.moduleId}
                        start={!index}
                    />
                )}
            />
        </Page>
    )
}

function AssetDisplay({
    id,
    moduleId,
    asset,
    start,
    end,
}: {
    id: AssetId
    moduleId?: Metro.ModuleID
    asset: Asset
    start?: boolean
    end?: boolean
}) {
    const isDisplayable = Displayable.has(asset.type)
    const metadata = [
        ['ID', id.toString()],
        ['Type', asset.type],
    ] as [string, string, unpressable?: boolean, hiddenInText?: boolean][]

    metadata.push(
        moduleId
            ? ['Module ID', moduleId.toString()]
            : [
                  'Custom asset',
                  'This is a custom asset registered by a plugin.',
                  true,
                  true,
              ],
    )

    return (
        <TableRow
            end={end}
            icon={
                isDisplayable ? (
                    <Image source={id} style={styles.smallPreview} />
                ) : (
                    <TableRowAssetIcon
                        name={
                            asset.type in UndisplayableFallback
                                ? UndisplayableFallback[
                                      asset.type as keyof typeof UndisplayableFallback
                                  ]
                                : UndisplayableFallback.default
                        }
                        variant="danger"
                    />
                )
            }
            label={asset.name}
            onPress={() => {
                openAssetDisplayAlert(asset, id, metadata)
            }}
            start={start}
            subLabel={metadata
                .filter(([, , , hiddenInText]) => !hiddenInText)
                .map(([name, value]) => `${name}: ${value ?? 'N/A'}`)
                .join('  •  ')}
            variant={isDisplayable ? 'default' : 'danger'}
        />
    )
}

const CopyIcon = lookupGeneratedIconComponent('CopyIcon')

function openAssetDisplayAlert(
    asset: Asset,
    id: AssetId,
    metadata: [string, string, pressable?: boolean, ...unknown[]][],
) {
    const isDisplayable = Displayable.has(asset.type)

    AlertActionCreators.openAlert(
        'asset-display',
        <AlertModal
            actions={<AlertActionButton text="Close" variant="secondary" />}
            extraContent={
                <>
                    {isDisplayable ? (
                        <Image source={id} style={styles.preview} />
                    ) : (
                        <PreviewUnavailable type={asset.type} />
                    )}
                    <TableRowGroup>
                        {metadata.map(([name, value, unpressable]) => (
                            <TableRow
                                key={id}
                                label={name}
                                onPress={
                                    unpressable
                                        ? undefined
                                        : () => {
                                              Clipboard.setString(value)

                                              ToastActionCreators.open({
                                                  key: 'ASSET_BROWSER_COPIED',
                                                  IconComponent: CopyIcon,
                                                  content: `Copied ${name} to clipboard`,
                                              })
                                          }
                                }
                                subLabel={value}
                            />
                        ))}
                    </TableRowGroup>
                    <Text color="text-danger" variant="text-xs/semibold">
                        Note: Asset IDs and module IDs are not consistent
                        between app launches and app versions respectively and
                        should only be used when absolutely needed.
                    </Text>
                </>
            }
            title={asset.name}
        />,
    )
}

function PreviewUnavailable({ type }: { type: string }) {
    return (
        <Text
            color="text-danger"
            style={styles.centeredText}
            variant="text-sm/medium"
        >
            Asset type {type.toUpperCase()} is not supported for preview.
        </Text>
    )
}

const styles = StyleSheet.create({
    listContainer: {
        paddingBottom: 16,
    },
    smallPreview: {
        height: 32,
        width: 32,
    },
    preview: {
        flex: 1,
        width: 'auto',
        height: 192,
        resizeMode: 'contain',
    },
    centeredText: {
        width: '100%',
        textAlign: 'center',
    },
})
