import { ToastActionCreators } from '@revenge-mod/discord/actions'
import { TypedEventEmitter } from '@revenge-mod/discord/common/utils'
import { lookupGeneratedIconComponent } from '@revenge-mod/utils/discord'
import { getErrorStack } from '@revenge-mod/utils/error'
import { useReRender } from '@revenge-mod/utils/react'
import { useEffect } from 'react'
import { api } from '.'

export const RDTContext: {
    ws: WebSocket | undefined
    addr: string
    con: boolean
    active: boolean
} = {
    active: Boolean(globalThis.__REACT_DEVTOOLS__),
    ws: undefined,
    addr: 'localhost:8097',
    con: false,
}

const events = new TypedEventEmitter<{
    connect: []
    disconnect: []
    errored: [unknown]
}>()

const CircleXIcon = lookupGeneratedIconComponent(
    'CircleXIcon',
    'CircleXIcon-secondary',
    'CircleXIcon-primary',
)

export function connect() {
    if (!RDTContext.active || RDTContext.ws) return

    const ws = (RDTContext.ws = new WebSocket(`ws://${RDTContext.addr}`))

    ws.addEventListener('open', () => {
        RDTContext.con = true
        events.emit('connect')
    })

    ws.addEventListener('close', () => {
        cleanup()
        events.emit('disconnect')
    })

    ws.addEventListener('error', e => {
        cleanup()
        events.emit('errored', e)

        const err = (e as { message: string }).message ?? getErrorStack(e)
        api.logger.error('React DevTools error:', err)

        ToastActionCreators.open({
            key: 'REACT_DEVTOOLS_ERROR',
            IconComponent: CircleXIcon,
            content: err,
        })
    })

    __REACT_DEVTOOLS__!.exports.connectToDevTools({
        websocket: ws,
    })
}

function cleanup() {
    RDTContext.con = false
    RDTContext.ws = undefined
}

export function disconnect() {
    if (RDTContext.ws) RDTContext.ws.close()
}

export function useIsConnected() {
    const rerender = useReRender()

    useEffect(() => {
        events.on('connect', rerender)
        events.on('disconnect', rerender)

        return () => {
            events.off('connect', rerender)
            events.off('disconnect', rerender)
        }
    }, [rerender])

    return RDTContext.con
}
