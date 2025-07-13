import { AlertActionCreators } from '@revenge-mod/discord/actions'
import { Design } from '@revenge-mod/discord/design'
import { byProps } from '@revenge-mod/modules/finders/filters'
import { getModule } from '@revenge-mod/modules/finders/get'
import { InternalPluginFlags, registerPlugin } from '@revenge-mod/plugins/_'
import { PluginFlags } from '@revenge-mod/plugins/constants'
import { afterJSX, beforeJSX } from '@revenge-mod/react/jsx-runtime'
import { findInReactFiber } from '@revenge-mod/utils/react'
import { Image } from 'react-native'
import { Badges, UsersWithBadges } from './constants'
import { useStyles } from './styles'
import { afterReconciled } from './utils'
import type { FC, JSX, ReactElement } from 'react'
import type {
    ImageProps,
    ImageSourcePropType,
    ImageStyle,
    PressableProps,
    StyleProp,
} from 'react-native'
import type { Badge } from './constants'

const DUMMY_SYMBOL = {} as unknown as string

registerPlugin(
    {
        id: 'revenge.user-badges',
        name: 'User Badges',
        description: 'Badges for Revenge contributors and sponsors.',
        author: 'Revenge',
        icon: 'ShieldUserIcon',
    },
    {
        start({ cleanup }) {
            const unsub = getModule(
                byProps<{
                    ProfileBadgeRows: FC<ProfileBadgeRowsProps>
                }>('ProfileBadgeRows'),
                ({ ProfileBadgeRows }) => {
                    unsub()

                    cleanup(
                        beforeJSX(ProfileBadgeRows, args => {
                            const [, props] = args
                            if (
                                UsersWithBadges[props.userId] &&
                                !props.badges.length
                            )
                                // Push a dummy badge to ensure we can always get the ProfileBadge in the reconciled fiber
                                // @ts-expect-error
                                props.badges.unshift({
                                    id: DUMMY_SYMBOL,
                                })

                            return args
                        }),
                    )

                    cleanup(
                        afterJSX(ProfileBadgeRows, fiber => {
                            patchProfileBadgeRows(fiber as JSX.Element)
                            return fiber
                        }),
                    )
                },
            )

            cleanup(unsub)
        },
        stop({ plugin }) {
            plugin.flags |= PluginFlags.ReloadRequired
        },
    },
    PluginFlags.Enabled,
    // Essential because this is a perk
    InternalPluginFlags.Internal | InternalPluginFlags.Essential,
)

function patchProfileBadgeRows(
    el: ReactElement<ProfileBadgeRowsProps, FC<ProfileBadgeRowsProps>>,
) {
    const styles = useStyles()

    // Patch once to get the reconciled fiber
    const unpatch = afterReconciled(el, fiber => {
        unpatch()

        const view = findInReactFiber(
            fiber as ReactElement,
            isViewContainingProfileBadgeElements,
        )

        if (view) {
            // Guaranteed to exist (check isViewContainingProfileBadgeElements impl.)
            const [{ type: ProfileBadge, props }] = view.props.children

            const badges = UsersWithBadges[props.userId]
            if (badges) {
                for (const id of badges) {
                    const badge = Badges[id]

                    const el = (
                        <ProfileBadge
                            {...props}
                            key={id}
                            id={id}
                            label={badge.label}
                            source={badge.icon}
                        />
                    )

                    patchProfileBadge(el, styles, badge)
                    view.props.children.push(el)
                }

                // Remove the dummy badge
                if (props.id === DUMMY_SYMBOL) view.props.children.shift()
            }
        }

        return fiber
    })
}

function patchProfileBadge(
    el: ReactElement<ProfileBadgeProps, FC<ProfileBadgeProps>>,
    styles: ReturnType<typeof useStyles>,
    badge: Badge,
) {
    const { bnw, showDialog } = badge

    // Only patch if we actually need to
    if (bnw || showDialog) {
        // Patch once to get the reconciled fiber
        const unpatch = afterReconciled(el, fiber => {
            unpatch()

            if (showDialog) {
                const pressable = findInReactFiber(
                    fiber as ReactElement,
                    (node): node is ReactElement<PressableProps> =>
                        node.type?.render,
                )

                if (pressable)
                    pressable.props.onPress = () => {
                        openBadgeDialog(styles, badge)
                    }
            }

            if (bnw) {
                const image = findInReactFiber(
                    fiber as ReactElement,
                    (node): node is ReactElement<ImageProps> =>
                        node.type === Image,
                )

                if (image)
                    (
                        image.props.style as Extract<
                            StyleProp<ImageStyle>,
                            any[]
                        >
                    ).push(styles.tinted)
            }

            return fiber
        })
    }
}

function openBadgeDialog(
    styles: ReturnType<typeof useStyles>,
    { label, description, bnw, icon }: Badge,
) {
    AlertActionCreators.openAlert(
        'CUSTOM_PROFILE_BADGE',
        <Design.AlertModal
            title={
                <Design.Stack style={styles.stack}>
                    <Image
                        source={icon}
                        style={[styles.display, bnw && styles.tinted]}
                    />
                    <Design.Text
                        variant="heading-lg/bold"
                        color="header-primary"
                    >
                        {label}
                    </Design.Text>
                </Design.Stack>
            }
            content={description}
            actions={<Design.AlertActionButton text="Okay" />}
        />,
    )
}

const isViewContainingProfileBadgeElements = (
    node: any,
): node is ReactElement<{
    children: Array<ReactElement<ProfileBadgeProps, FC<ProfileBadgeProps>>>
    // View must have at least 1 child that is a ProfileBadge
}> => node.props?.children?.[0]?.type.name === 'ProfileBadge'

interface ProfileBadgeProps {
    id: string
    userId: string
    label: string
    source: ImageSourcePropType
    themeType: string
    badgeSize: number
}

interface ProfileBadgeRowsProps {
    userId: string
    badges: Array<{
        description: string
        icon: string
        id: string
        link?: string
    }>
    themeType: string
    showToastOnPress?: boolean
}
