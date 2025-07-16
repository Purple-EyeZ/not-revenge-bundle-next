import type { ElementType, JSX } from 'react'
import type { AfterJSXCallback, BeforeJSXCallback, InsteadJSXCallback } from '.'

export const jPatches = new Map<
    ElementType | keyof JSX.IntrinsicElements,
    [
        before?: Set<BeforeJSXCallback<any>>,
        after?: Set<AfterJSXCallback<any>>,
        instead?: Set<InsteadJSXCallback<any>>,
    ]
>()
