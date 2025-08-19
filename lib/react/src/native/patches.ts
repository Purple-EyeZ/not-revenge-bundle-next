import { instead } from '@revenge-mod/patcher'
import { ReactNative } from '..'
import { sAfterRunApplication, sBeforeRunApplication } from './_internal'

instead(ReactNative.AppRegistry, 'runApplication', function (args, orig) {
    for (const cb of sBeforeRunApplication)
        try {
            cb()
        } catch {}

    Reflect.apply(orig, this, args)

    for (const cb of sAfterRunApplication)
        try {
            cb()
        } catch {}
})
