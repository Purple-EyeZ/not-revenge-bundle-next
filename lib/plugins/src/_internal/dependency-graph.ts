import { getPluginDependencies, pMetadata } from '../_internal'
import type { AnyPlugin } from '../_internal'

/// PLUGIN DEPENDENCY GRAPHING

// We don't store the graph as a tree, but rather as a set of nodes.

// Root nodes are plugins that have dependencies, but no dependents. These plugins are the starting points of the dependency graph.
// Leaf nodes are plugins that have no dependencies, but may have dependents. These plugins are the end points of the dependency graph.

// Start order: Single nodes (no dependencies & dependents) -> Leaf nodes (no dependencies, maybe dependents) -> Root nodes (with dependencies, no dependents)
// This way we can ensure that all dependencies are started before the plugin itself.

export const pRootNodes = new Set<AnyPlugin>()
export const pLeafOrSingleNodes = new Set<AnyPlugin>()

// Visited non-leaf nodes
const visited = new WeakSet<AnyPlugin>()

// Ordered list of plugins to be started
export const pListOrdered: AnyPlugin[] = []
// Pending plugins to be computed
export const pPending = new Set<AnyPlugin>()

export function computePendingNodes() {
    for (const plugin of pLeafOrSingleNodes) pListOrdered.unshift(plugin)
    pLeafOrSingleNodes.clear()

    for (const plugin of pPending) resolvePluginGraph(plugin)
    pPending.clear()

    const stack = [...pRootNodes]
    pRootNodes.clear()

    while (stack.length) {
        const plugin = stack.pop()!
        if (visited.has(plugin)) continue

        if (plugin.manifest.dependencies?.length)
            for (const dep of getPluginDependencies(plugin)) stack.push(dep)
        else {
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

        for (const dep of getPluginDependencies(plugin)) {
            const depMeta = pMetadata.get(dep)!
            depMeta.dependents.push(plugin)

            // Not a root node if it has dependencies
            if (dep.manifest.dependencies?.length) pRootNodes.delete(dep)
        }
    } else pLeafOrSingleNodes.add(plugin)
}
