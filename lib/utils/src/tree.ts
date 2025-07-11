import type { ExtractPredicate } from './types'

export type SearchTree = Record<string, any>
export type SearchFilter = (tree: SearchTree) => boolean

export interface FindInTreeOptions {
    /**
     * A set of keys to search for in the tree.
     */
    walkable?: Set<string>
    /**
     * A set of keys to ignore when searching the tree.
     */
    ignore?: Set<string>
    /**
     * The maximum depth to search in the tree.
     *
     * @default 100
     */
    maxDepth?: number
}

export function findInTree<F extends SearchFilter>(
    tree: SearchTree,
    filter: F,
    opts?: FindInTreeOptions,
): ExtractPredicate<F> | undefined {
    type StackItem = [node: any, depth: number]
    const stack: StackItem[] = [[tree, 0]]
    const maxDepth = opts?.maxDepth ?? 100

    while (stack.length > 0) {
        const [node, depth] = stack.pop()!
        if (depth > maxDepth || !node) continue

        if (filter(node)) return node

        const isArray = Array.isArray(node)
        const keys = isArray ? node : Object.keys(node)

        for (const key of keys) {
            const item = isArray ? key : node[key]

            if (typeof item !== 'object' || item == null) continue

            if (!isArray && opts?.walkable?.size && !opts.walkable?.has(key))
                continue
            if (!isArray && opts?.ignore?.has(key)) continue

            stack.push([item, depth + 1])
        }
    }
}
