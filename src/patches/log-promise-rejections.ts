/**
 * Hermes doesn't natively support Promises, it instead has a polyfill for it.
 * It doesn't throw and never logs rejections in production, so we are patching it to catch errors when using async functions.
 *
 * See for reference: https://github.com/facebook/hermes/blob/3332fa020cae0bab751f648db7c94e1d687eeec7/lib/InternalBytecode/01-Promise.js#L446
 */

import { getErrorStack } from '@revenge-mod/utils/error'

const ErrorTypeWhitelist = [ReferenceError, TypeError, RangeError]

Promise._m = (promise, err) => {
    if (err)
        setTimeout(
            () => {
                // (if promise._h is 0)
                if (!promise._h)
                    nativeLoggingHook(
                        `\u001b[33mUnhandled promise rejection: ${getErrorStack(err)}\u001b[0m`,
                        2,
                    )
            },
            // The time is completely arbitary. I've picked what Hermes chose.
            ErrorTypeWhitelist.some(it => err instanceof it) ? 0 : 2000,
        )
}
