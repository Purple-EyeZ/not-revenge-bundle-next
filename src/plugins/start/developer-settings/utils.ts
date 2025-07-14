import {
    addSettingsItemToSection,
    registerSettingsItems,
} from '@revenge-mod/discord/modules/settings'
import { api } from '.'
import { Setting } from './constants'
import AssetBrowserSetting from './definitions/AssetBrowserSetting'
import EvalJSSetting from './definitions/EvalJSSetting'
import RDTAutoConnectSetting from './definitions/RDTAutoConnectSetting'
import RDTConnectSetting from './definitions/RDTConnectSetting'
import RDTDisconnectSetting from './definitions/RDTDisconnectSetting'
import RDTVersionSetting from './definitions/RDTVersionSetting'
import RevengeDeveloperSetting from './definitions/RevengeDeveloperSetting'

export function register() {
    api.cleanup(
        registerSettingsItems({
            [Setting.RevengeDeveloper]: RevengeDeveloperSetting,
            [Setting.RDTVersion]: RDTVersionSetting,
            [Setting.RDTAutoConnect]: RDTAutoConnectSetting,
            [Setting.RDTConnect]: RDTConnectSetting,
            [Setting.RDTDisconnect]: RDTDisconnectSetting,
            [Setting.EvalJS]: EvalJSSetting,
            [Setting.AssetBrowser]: AssetBrowserSetting,
        }),
        addSettingsItemToSection('REVENGE', Setting.RevengeDeveloper),
    )
}
