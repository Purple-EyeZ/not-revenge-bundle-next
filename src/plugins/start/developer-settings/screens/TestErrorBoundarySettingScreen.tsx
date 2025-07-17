import { useEffect } from 'react'

export default function TestErrorBoundarySettingScreen() {
    let x = 0

    useEffect(() => {
        x++
    })

    // @ts-expect-error: Intentional
    return x < 2 ? <undefined /> : null
}
