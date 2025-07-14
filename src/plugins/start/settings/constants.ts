export const Setting = {
    // MAIN SETTINGS

    Revenge: 'Revenge',
    RevengePlugins: 'RevengePlugins',
    RevengeThemes: 'RevengeThemes',
    RevengeFonts: 'RevengeFonts',
    RevengeCustomPage: 'RevengeCustomPage',

    // SUBSETTINGS

    RevengeDiscord: 'RevengeDiscord',
    RevengeSourceRepository: 'RevengeSourceRepository',
    RevengeLicense: 'RevengeLicense',
    Reload: 'Reload',

    RevengeVersion: 'RevengeVersion',
    ReactVersion: 'ReactVersion',
    ReactNativeVersion: 'ReactNativeVersion',
    HermesVersion: 'HermesVersion',
} as const

export const RouteNames = {
    [Setting.Revenge]: 'Revenge',
    [Setting.RevengePlugins]: 'Revenge Plugins',
    [Setting.RevengeThemes]: 'Revenge Themes',
    [Setting.RevengeFonts]: 'Revenge Fonts',
    [Setting.RevengeCustomPage]: 'Revenge Custom Page',
} as const
