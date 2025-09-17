import { Storage } from '@revenge-mod/storage'
import { useReRender } from '@revenge-mod/utils/react'
import { useLayoutEffect } from 'react'
import type { StorageSubscription } from '@revenge-mod/storage'

const proto = Storage.prototype as Storage<any>
// Actual implementation of Storage#use
proto.use = function (filter) {
    if (!this.cache) this.get()

    const reRender = useReRender()

    useLayoutEffect(() => {
        const sub: StorageSubscription = filter
            ? (update, mode) => {
                  if (filter(update, mode)) reRender()
              }
            : reRender

        return this.subscribe(sub)
    }, [filter, reRender])

    return this.cache
}
