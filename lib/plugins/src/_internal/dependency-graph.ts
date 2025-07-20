import { pList, pMetadata } from '../_internal'
import { PluginFlags } from '../constants'
import type { AnyPlugin } from '../_internal'

/// PLUGIN DEPENDENCY GRAPHING

// We don't store the graph as a tree, but rather as a set of nodes.

// Root nodes are plugins that have dependencies, but no dependents. These plugins are the starting points of the dependency graph.
// Leaf nodes are plugins that have no dependencies, but may have dependents. These plugins are the end points of the dependency graph.

// Start order: Single nodes (no dependencies & dependents) -> Leaf nodes (no dependencies, maybe dependents) -> Root nodes (with dependencies, no dependents)
// This way we can ensure that all dependencies are started before the plugin itself.

export const pRootNodes = new Set<AnyPlugin>()
export const pLeafOrSingleNodes = new Set<AnyPlugin>()

const visited = new WeakSet<AnyPlugin>()

// Ordered list of plugins to be started
export const pListOrdered: AnyPlugin[] = []
// Pending plugins to be computed
export const pPending = new Set<AnyPlugin>()

export function computePendingNodes() {
    for (const plugin of pPending) resolvePluginGraph(plugin)
    pPending.clear()

    for (const plugin of pLeafOrSingleNodes) {
        pListOrdered.unshift(plugin)
        visited.add(plugin)
    }
    pLeafOrSingleNodes.clear()

    const stack = [...pRootNodes]
    pRootNodes.clear()

    while (stack.length) {
        const plugin = stack.pop()!
        if (visited.has(plugin)) continue

        if (plugin.manifest.dependencies?.length) {
            for (const dep of plugin.manifest.dependencies) {
                const depPlugin = pList.get(dep.id)
                if (depPlugin) stack.push(depPlugin)
            }
        } else {
            pListOrdered.push(plugin)
            visited.add(plugin)
        }
    }
}

export function resolvePluginGraph(plugin: AnyPlugin) {
    const { manifest } = plugin

    if (manifest.dependencies?.length) {
        // Optimisitically add to root nodes (if there are dependents, it will be removed later)
        pRootNodes.add(plugin)

        for (const { id } of manifest.dependencies) {
            const dep = pList.get(id)
            if (!dep) {
                // TODO: Once external plugins are implemented, we will have to check the external plugin registry here as well
                // External plugin registry should ideally be Record<PluginManifest['id'], [PluginManifest, Flags: number, PluginCode: string]>
                // Then we register the plugin here and do dep = pList.get(id) again

                throw new Error(
                    `Plugin "${manifest.id}" depends on unregistered plugin "${id}"`,
                )
            }

            if (!(dep.flags & PluginFlags.Enabled))
                throw new Error(
                    `Plugin "${manifest.id}" depends on disabled plugin "${id}"`,
                )

            const depMeta = pMetadata.get(dep)!
            depMeta.dependents.push(plugin)

            // Not a root node if it has dependencies
            if (dep.manifest.dependencies?.length) pRootNodes.delete(dep)
        }
    } else pLeafOrSingleNodes.add(plugin)
}
