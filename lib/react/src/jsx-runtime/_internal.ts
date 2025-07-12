import type { ElementType } from 'react'
import type { AfterJSXCallback, BeforeJSXCallback, InsteadJSXCallback } from '.'

export const jPatches = new Map<
    ElementType | string,
    [
        before?: Set<BeforeJSXCallback>,
        after?: Set<AfterJSXCallback>,
        instead?: Set<InsteadJSXCallback>,
    ]
>()
