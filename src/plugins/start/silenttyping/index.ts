import { byProps } from '@revenge-mod/modules/finders/filters'
import { lookupModule } from '@revenge-mod/modules/finders/lookup'
import { waitForModules } from '@revenge-mod/modules/finders/wait'
import { instead } from '@revenge-mod/patcher'
import { registerPlugin } from '@revenge-mod/plugins/_'
import { noop } from '@revenge-mod/utils/callback'

type TypingMethods = {
    startTyping(channelId: string): void
    stopTyping(channelId: string): void
}

let TypingModule: TypingMethods | undefined

registerPlugin(
    {
        id: 'purpleeyez.silenttyping',
        name: 'Silent Typing',
        description: "Others won't see you typing.",
        author: 'Purple_Ξye™',
        icon: 'EyeSlashIcon',
    },
    {
        start({ cleanup, logger }) {
            const applyPatches = (Typing: TypingMethods) => {
                logger.info('[Silent Typing] Patching Typing module...')

                cleanup(
                    instead(Typing, 'startTyping', noop),
                    instead(Typing, 'stopTyping', noop),
                )
            }

            TypingModule ??= lookupModule(
                byProps('startTyping', 'stopTyping'),
            )?.[0]

            if (TypingModule) {
                applyPatches(TypingModule)
            } else {
                const unsub = waitForModules(
                    byProps('startTyping', 'stopTyping'),
                    (Typing: TypingMethods) => {
                        TypingModule = Typing
                        applyPatches(Typing)
                    },
                )
                cleanup(unsub)
            }
        },
    },
    1,
    0,
)
