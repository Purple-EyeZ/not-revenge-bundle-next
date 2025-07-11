import { pUnscopedApi } from '@revenge-mod/plugins/_'
import { defineLazyProperty } from '@revenge-mod/utils/object'
import type { UnscopedInitPluginApi } from '@revenge-mod/plugins/types'

const uapi = pUnscopedApi as UnscopedInitPluginApi

defineLazyProperty(uapi, 'components', () => {
    return require('.')
})
