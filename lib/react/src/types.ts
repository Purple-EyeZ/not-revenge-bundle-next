export namespace ReactNative {
    export namespace AssetsRegistry {
        export type AssetDestPathResolver = 'android' | 'generic'

        export interface PackagerAsset {
            __packager_asset: boolean
            fileSystemLocation?: string
            httpServerLocation?: string
            width?: number
            height?: number
            scales: number[]
            hash: string
            name: string
            type: string
            resolver?: AssetDestPathResolver
        }
    }

    export interface AssetsRegistry {
        registerAsset(asset: AssetsRegistry.PackagerAsset): number
        getAssetByID(assetId: number): AssetsRegistry.PackagerAsset
    }
}

export type RunApplicationCallback = () => any
