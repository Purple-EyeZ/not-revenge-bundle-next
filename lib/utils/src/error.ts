export function getErrorStack(e: unknown) {
    return e instanceof Error ? e.stack : String(e)
}

export function getCurrentStack() {
    const { stack } = new Error()

    let newlineCount = 0

    for (let i = 0; i < stack!.length; i++)
        if (stack![i] === '\n' && newlineCount++ === 1)
            return stack!.slice(i + 1)

    return stack!.slice(stack!.indexOf('\n') + 1)
}
