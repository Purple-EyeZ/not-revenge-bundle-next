import { after } from '@revenge-mod/patcher'
import type { FC, ReactElement, ReactNode } from 'react'

export const afterReconciled = (
    el: ReactElement<any, FC<any>>,
    hook: (fiber: ReactNode) => ReactNode,
) =>
    after(el, 'type', fiber =>
        fiber instanceof Promise ? fiber.then(hook) : hook(fiber),
    )
