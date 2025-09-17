import { after } from '@revenge-mod/patcher'
import type { FC, ReactElement, ReactNode } from 'react'

export const afterRendered = (
    el: ReactElement<any, FC<any>>,
    hook: (el: ReactNode) => ReactNode,
) =>
    after(el, 'type', el =>
        el instanceof Promise ? el.then(hook) : hook(el),
    )
