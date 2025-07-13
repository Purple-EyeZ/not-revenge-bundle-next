import { Tokens } from '@revenge-mod/discord/common'
import { Design } from '@revenge-mod/discord/design'

export const useStyles = Design.createStyles({
    tinted: {
        tintColor: Tokens.default.colors.HEADER_PRIMARY,
    },
    stack: {
        alignItems: 'center',
    },
    display: {
        width: 96,
        height: 96,
        objectFit: 'contain',
    },
})
