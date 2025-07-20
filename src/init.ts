// Initialize init libraries
import '@revenge-mod/utils/init'
import '@revenge-mod/react/init'
import '@revenge-mod/storage/init'
import '@revenge-mod/externals/init'
import '@revenge-mod/discord/init'
import '@revenge-mod/components/init'

// Run all init plugins
import '~/plugins/init'
import '@revenge-mod/plugins/init'

import { onRunApplication } from '@revenge-mod/react/native'
import { onError } from './preinit'

const unsub = onRunApplication(() => {
    unsub()

    try {
        require('./start')
    } catch (e) {
        onError(e)
    }
})
