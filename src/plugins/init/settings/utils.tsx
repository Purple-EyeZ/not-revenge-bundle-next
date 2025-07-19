import { RootNavigationRef } from '@revenge-mod/discord/modules/main_tabs_v2'
import type { ReactNavigationParamList } from '@revenge-mod/externals/react-navigation'
import type { Plugin } from '@revenge-mod/plugins/types'

export function navigatePluginSettings(plugin: Plugin) {
    const navigation =
        RootNavigationRef.getRootNavigationRef<ReactNavigationParamList>()
    if (!navigation.isReady()) return

    navigation.navigate(plugin.manifest.id)
}
