import { Storage } from '@revenge-mod/storage'
import { useReRender } from '@revenge-mod/utils/react'
import { useEffect } from 'react'
import type { StorageSubscription } from '@revenge-mod/storage'

// Actual implementation of Storage#use
const SP: Storage<any> = Storage.prototype
SP.use = function (filter) {
    if (!this.cache) this.get()

    const reRender = useReRender()

    useEffect(() => {
        const sub: StorageSubscription = filter
            ? v => {
                  if (filter(v)) reRender()
              }
            : reRender

        return this.subscribe(sub)
    }, [filter, reRender])

    return this.cache
}
