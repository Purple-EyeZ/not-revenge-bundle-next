import MagicString from 'magic-string'
import type { RolldownPlugin } from 'rolldown'

// `import defer * as ns from './bar.js'`
const DEFER_NAMESPACE_IMPORT_REGEX =
    /import\s+defer\s+(\*\s+as\s+\w+)\s+from\s+(['"])([^'"]+)\2\s*;?/g

/**
 * Really wacky support for `import defer` statements by transforming them to `require()`.
 *
 * Only supports JavaScript files. TypeScript files with conflicting type names may cause issues.
 *
 * `import defer` statements are transformed to provide on-demand/lazy loading.
 *
 * This is achieved by creating a scoped closure to cache the module.
 * - The deferred namespace import is converted to a function that triggers the `require()` when called.
 * - Usages like `ns.foo` are rewritten to `ns().foo` to execute the loader.
 */
export default function importDefer() {
    return {
        name: 'import-defer',
        async transform(code) {
            const s = new MagicString(code)
            let hasReplacements = false

            const allBindingMatches = [
                ...code.matchAll(DEFER_NAMESPACE_IMPORT_REGEX),
            ]

            for (const match of allBindingMatches) {
                const [fullMatch, bindingsStr, , modulePath] = match
                const bindings = parseBindings(bindingsStr)

                if (bindings.length > 0) {
                    const localName = bindings[0].local

                    // Replace the original import defer statement with the IIFE that creates the lazy function.
                    s.overwrite(
                        match.index,
                        match.index + fullMatch.length,
                        generateDeferReplacement(bindings, modulePath),
                    )
                    hasReplacements = true

                    // Find all usages of the imported identifier
                    const usageRegex = new RegExp(`\\b${localName}\\b`, 'g')

                    for (const usageMatch of code.matchAll(usageRegex)) {
                        // Original import declaration
                        if (
                            usageMatch.index >= match.index &&
                            usageMatch.index < match.index + fullMatch.length
                        ) {
                            continue
                        }

                        const startIndex = usageMatch.index
                        const endIndex = startIndex + usageMatch[0].length

                        // Check for context to decide on the replacement by inspecting surrounding characters.
                        // Look for the next non-whitespace character.
                        let nextChar = ''
                        let i = endIndex
                        while (i < code.length) {
                            if (!/\s/.test(code[i])) {
                                nextChar = code[i]
                                break
                            }
                            i++
                        }

                        // Skip object property key: `Identifier: ...`
                        if (nextChar === ':') continue

                        let prevChar = ''
                        i = startIndex - 1
                        while (i >= 0) {
                            if (!/\s/.test(code[i])) {
                                prevChar = code[i]
                                break
                            }
                            i--
                        }

                        // Shorthand object property: { ..., Identifier, ... }
                        const isShorthand =
                            (prevChar === '{' || prevChar === ',') &&
                            (nextChar === '}' || nextChar === ',')

                        if (isShorthand)
                            s.overwrite(
                                startIndex,
                                endIndex,
                                `${localName}: ${localName}()`,
                            )
                        // All other usages (value, property access). `doThing(Identifier)`, `Identifier.foo`
                        else s.overwrite(startIndex, endIndex, `${localName}()`)
                    }
                }
            }

            if (!hasReplacements) return null

            return {
                code: s.toString(),
                map: s.generateMap({ hires: true }),
            }
        },
    } satisfies RolldownPlugin
}

type Bindings = { local: string; imported: string }[]

function parseBindings(bindingsStr: string): Bindings {
    const remainingStr = bindingsStr.trim()
    const namespaceMatch = remainingStr.match(/^\*\s+as\s+(\w+)/)
    if (namespaceMatch) return [{ local: namespaceMatch[1], imported: '*' }]

    return []
}

function generateDeferReplacement(bindings: Bindings, modulePath: string) {
    if (!bindings.length) return ''

    const [{ local: localName }] = bindings
    const cacheVar = `_cache_${modulePath.replace(/[^a-zA-Z0-9]/g, '_')}`

    return `var ${cacheVar};const ${localName}=()=>${cacheVar}??=require('${modulePath}');`
}
