import * as PluginApiReact_ from '@revenge-mod/react'
import * as PluginApiReactNative from '@revenge-mod/react/native'

export type PluginApiReact = typeof PluginApiReact_ & {
    native: typeof PluginApiReactNative
}

export const react: PluginApiReact = {
    ...PluginApiReact_,
    native: PluginApiReactNative,
}
