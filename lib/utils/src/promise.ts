export function allSettled(
    promises: Promise<any>[],
): Promise<PromiseSettledResult<any>[]> {
    const mapped = promises.map(p =>
        p instanceof Promise
            ? p
                  .then(
                      value =>
                          ({
                              status: 'fulfilled',
                              value,
                          }) as const,
                  )
                  .catch(
                      reason =>
                          ({
                              status: 'rejected',
                              reason,
                          }) as const,
                  )
            : ({
                  status: 'fulfilled',
                  value: p,
              } as const),
    )

    return Promise.all(mapped)
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

export function sleepReject(ms: number, msg?: string): Promise<void> {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(msg)
        }, ms)
    })
}
