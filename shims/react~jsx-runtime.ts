import { ReactJSXRuntime } from '@revenge-mod/react'
import { isProxified, unproxify } from '@revenge-mod/utils/proxy'
import type { ElementType } from 'react'

const { jsx: _jsx, jsxs: _jsxs, Fragment } = ReactJSXRuntime

const jsx: typeof _jsx = (type, props, key) => _jsx(unproxy(type), props, key)
const jsxs: typeof _jsxs = (type, props, key) =>
    _jsxs(unproxy(type), props, key)

function unproxy(type: any): ElementType {
    return isProxified(type) ? unproxify(type) : type
}

module.exports = { jsx, jsxs, Fragment }
