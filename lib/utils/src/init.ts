import { pUnscopedApi } from '@revenge-mod/plugins/_'
import type { PluginApiUtils } from './preinit'

const utils = pUnscopedApi.utils as PluginApiUtils

utils.discord = require('@revenge-mod/utils/discord')
utils.react = require('@revenge-mod/utils/react')
