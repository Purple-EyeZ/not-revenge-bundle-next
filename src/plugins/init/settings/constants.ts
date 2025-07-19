export const Setting = {
    // MAIN SETTINGS

    Revenge: 'Revenge',
    RevengePlugins: 'RevengePlugins',
    RevengeThemes: 'RevengeThemes',
    RevengeFonts: 'RevengeFonts',

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
} as const
