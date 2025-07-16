import RevengeIcon from '~assets/RevengeIcon'
// TODO(PalmDevs): switch to external fetches
import Data from './data.json'
import type { ImageSourcePropType } from 'react-native'

// TODO(PalmDevs): possibly fetch from external source?
export const Badges = {
    revenge_team: {
        label: 'Revenge Team',
        description: 'This user is a Revenge team member.',
        icon: RevengeIcon,
        bnw: true,
        showDialog: true,
    },
} satisfies Record<string, Badge>

export const UsersWithBadges = Data as Record<string, BadgeId[]>

export type Badge = {
    label: string
    icon: ImageSourcePropType
    description: string
    /**
     * Black and white icon
     * @default false
     */
    bnw?: boolean
    showDialog?: boolean
}

export type BadgeId = keyof typeof Badges
