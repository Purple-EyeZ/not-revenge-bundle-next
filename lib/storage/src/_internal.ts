import type { Storage, StorageSubscription } from '.'

export const instanceToSubscriptions = new WeakMap<
    Storage<any>,
    Set<StorageSubscription<any>>
>()
