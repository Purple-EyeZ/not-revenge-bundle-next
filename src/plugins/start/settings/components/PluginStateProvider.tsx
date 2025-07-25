import { isPluginEnabled, pEmitter, pList } from '@revenge-mod/plugins/_'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { AnyPlugin } from '@revenge-mod/plugins/_'
import type { ReactNode } from 'react'

export interface PluginEnabledStates {
    [pluginId: string]: boolean
}

const PluginStatesContext = createContext<{
    enabled: PluginEnabledStates
} | null>(null)

export default function PluginStatesProvider({
    children,
}: {
    children: ReactNode
}) {
    const [enabled, setEnabled] = useState<PluginEnabledStates>(() => {
        const states: PluginEnabledStates = {}
        for (const plugin of pList.values()) {
            states[plugin.manifest.id] = isPluginEnabled(plugin)
        }
        return states
    })

    useEffect(() => {
        const handleEnabled = (plugin: AnyPlugin) => {
            setEnabled(prev => ({
                ...prev,
                [plugin.manifest.id]: true,
            }))
        }

        const handleDisabled = (plugin: AnyPlugin) => {
            setEnabled(prev => ({
                ...prev,
                [plugin.manifest.id]: false,
            }))
        }

        pEmitter.on('enabled', handleEnabled)
        pEmitter.on('disabled', handleDisabled)

        return () => {
            pEmitter.off('enabled', handleEnabled)
            pEmitter.off('disabled', handleDisabled)
        }
    }, [])

    const contextValue = useMemo(
        () => ({
            enabled: enabled,
        }),
        [enabled],
    )

    return (
        <PluginStatesContext.Provider value={contextValue}>
            {children}
        </PluginStatesContext.Provider>
    )
}

export function usePluginEnabled(plugin: AnyPlugin) {
    const context = useContext(PluginStatesContext)

    if (!context) {
        console.warn('usePluginEnabled not used within a PluginStateProvider')
        return isPluginEnabled(plugin)
    }

    return context.enabled[plugin.manifest.id]
}
