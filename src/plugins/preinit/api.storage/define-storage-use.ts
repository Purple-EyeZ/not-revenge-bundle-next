import { Storage } from '@revenge-mod/storage'
import { useReRender } from '@revenge-mod/utils/react'
import { useEffect } from 'react'
import { instanceToSubscriptions } from '../../../../lib/storage/src/_internal'
import type { StorageSubscription } from '@revenge-mod/storage'

// Actual implementation of Storage#use
const SP: Storage<any> = Storage.prototype
SP.use = function (filter) {
    if (!this.cache) this.get()

    const reRender = useReRender()
    const subscriptions = instanceToSubscriptions.get(this)!

    useEffect(() => {
        const sub: StorageSubscription = filter
            ? v => {
                  if (filter(v)) reRender()
              }
            : reRender

        subscriptions.add(sub)

        return () => {
            subscriptions.delete(sub)
        }
    }, [filter, reRender, subscriptions.add, subscriptions.delete])

    return this.cache
}
