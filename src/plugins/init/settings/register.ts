import {
    registerSettingsItems,
    registerSettingsSection,
} from '@revenge-mod/discord/modules/settings'
import { Setting } from './constants'
import HermesVersionSetting from './definitions/HermesVersionSetting'
import ReactNativeVersionSetting from './definitions/ReactNativeVersionSetting'
// import RevengeThemesSetting from './definitions/RevengeThemesSetting'
// import RevengeFontsSetting from './definitions/RevengeFontsSetting'
import ReactVersionSetting from './definitions/ReactVersionSetting'
import ReloadSetting from './definitions/ReloadSetting'
import RevengeCustomPageSetting from './definitions/RevengeCustomPageSetting'
import RevengeDiscordSetting from './definitions/RevengeDiscordSetting'
import RevengeLicenseSetting from './definitions/RevengeLicenseSetting'
import RevengePluginsSetting from './definitions/RevengePluginsSetting'
import RevengeSetting from './definitions/RevengeSetting'
import RevengeSourceRepositorySetting from './definitions/RevengeSourceRepositorySetting'
import RevengeVersionSetting from './definitions/RevengeVersionSetting'

registerSettingsItems({
    [Setting.Revenge]: RevengeSetting,
    [Setting.RevengePlugins]: RevengePluginsSetting,
    // [MobileSetting.REVENGE_THEMES]: RevengeThemesSetting,
    // [MobileSetting.REVENGE_FONTS]: RevengeFontsSetting,
    [Setting.RevengeCustomPage]: RevengeCustomPageSetting,
    [Setting.RevengeSourceRepository]: RevengeSourceRepositorySetting,
    [Setting.RevengeLicense]: RevengeLicenseSetting,
    [Setting.RevengeDiscord]: RevengeDiscordSetting,
    [Setting.Reload]: ReloadSetting,
    [Setting.RevengeVersion]: RevengeVersionSetting,
    [Setting.ReactVersion]: ReactVersionSetting,
    [Setting.ReactNativeVersion]: ReactNativeVersionSetting,
    [Setting.HermesVersion]: HermesVersionSetting,
})

registerSettingsSection('REVENGE', {
    label: 'Revenge',
    settings: [
        Setting.Revenge,
        Setting.RevengePlugins,
        // MobileSetting.RevengeThemes,
        // MobileSetting.RevengeFonts,
    ],
})
