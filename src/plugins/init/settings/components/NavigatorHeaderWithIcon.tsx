import { getAssetIdByName } from '@revenge-mod/assets'
import { Tokens } from '@revenge-mod/discord/common'
import { Stores } from '@revenge-mod/discord/common/flux'
import { Design } from '@revenge-mod/discord/design'
import { Image } from 'react-native'
import type { DiscordModules } from '@revenge-mod/discord/types'

const { NavigatorHeader } = Design
const { default: tokens } = Tokens

const ThemeStore = Stores.ThemeStore as DiscordModules.Flux.Store<{
    theme: string
}>

interface NavigatorHeaderWithIconProps {
    title: string
    icon: string
}

export default function NavigatorHeaderWithIcon({
    title,
    icon,
}: NavigatorHeaderWithIconProps) {
    return (
        <NavigatorHeader
            icon={
                <Image
                    style={{
                        width: 24,
                        height: 24,
                        marginEnd: 8,
                        tintColor: tokens.internal.resolveSemanticColor(
                            ThemeStore.theme,
                            tokens.colors.HEADER_PRIMARY,
                        ),
                    }}
                    source={getAssetIdByName(icon!)}
                />
            }
            title={title}
        />
    )
}
