import { transform } from '@swc/core'
import { $, main } from 'bun'
import chalk from 'chalk'
import { existsSync } from 'fs'
import { exists, mkdir, readdir, rm, writeFile } from 'fs/promises'
import { parse } from 'path'
import { rolldown } from 'rolldown'
import { aliasPlugin, importGlobPlugin } from 'rolldown/experimental'
import pkg from '../package.json'
import type { OutputChunk, RolldownPlugin } from 'rolldown'

const ShimsDir = `${import.meta.dir}/../shims`
const AssetsDir = `${import.meta.dir}/../src/assets`
const GeneratedAssetsDir = `${import.meta.dir}/../dist/assets/generated`

await rm(GeneratedAssetsDir, { recursive: true, force: true })
    .then(() =>
        console.debug(chalk.gray('\u{1F5BB} Deleted old generated assets')),
    )
    .catch()

const Dev =
    process.argv.includes('--dev') || process.env.NODE_ENV === 'development'

// If this file is being run directly, build the project
if (main === import.meta.filename) build()

export default async function build(dev = Dev, log = true) {
    const start = performance.now()

    if (log) console.info(chalk.gray('\u{1F5BB} Generating assets...'))
    await generateAssets()
    if (log) console.info(chalk.cyanBright('\u{1F5BB} Assets generated'))
    if (log) console.info(chalk.gray('\u{1F5CE} Compiling JS...'))

    const COMMIT = (await $`git rev-parse HEAD`.text()).trim().substring(0, 7)
    const REPO = 'revenge-mod/revenge-bundle-next'

    const bundle = await rolldown({
        input: 'src/index.ts',
        platform: 'neutral',
        optimization: {
            // ! BROKEN, DO NOT USE!
            // inlineConst: true,
            // @ts-expect-error: Option not documented, but added in 1.0.0-beta.30
            pifeForModuleWrappers: true,
        },
        preserveEntrySignatures: false,
        transform: {
            assumptions: {
                pureGetters: true,
                setPublicClassFields: true,
                noDocumentAll: true,
                // TODO: "Not implemented"
                // objectRestNoSymbols: true,
                // ignoreFunctionLength: true,
            },
        },
        tsconfig: 'tsconfig.json',
        treeshake: true,
        keepNames: true,
        moduleTypes: {
            '.webp': 'dataurl',
        },
        define: {
            __BUILD_DISCORD_SERVER_URL__: JSON.stringify(
                'https://discord.com/invite/ddcQf3s2Uq',
            ),
            __BUILD_SOURCE_REPOSITORY_URL__: JSON.stringify(
                `https://github.com/${REPO}`,
            ),
            __BUILD_LICENSE_URL__: JSON.stringify(
                `https://raw.githubusercontent.com/${REPO}/${COMMIT}/LICENSE`,
            ),
            __BUILD_VERSION__: JSON.stringify(pkg.version),
            __BUILD_COMMIT__: JSON.stringify(COMMIT),
            __BUILD_BRANCH__: JSON.stringify(
                (await $`git rev-parse --abbrev-ref HEAD`.text()).trim(),
            ),
            __DEV__: String(dev),

            // See types/build.d.ts for what these flags do
            __BUILD_FLAG_DEBUG_MODULE_LOOKUPS__: String(dev),
            __BUILD_FLAG_DEBUG_MODULE_WAITS__: String(dev),
            __BUILD_FLAG_DEBUG_LAZY_VALUES__: 'false',
            __BUILD_FLAG_LOG_PROMISE_REJECTIONS__: String(dev),
        },
        plugins: [
            aliasPlugin({
                entries: [
                    {
                        find: 'react/jsx-runtime',
                        replacement: `${ShimsDir}/react~jsx-runtime.ts`,
                    },
                    // Do not move React to the top!
                    // If you do that, react/jsx-runtime would resolve to ${ShimsDir}/react.ts/jsx-runtime instead.
                    {
                        find: 'react',
                        replacement: `${ShimsDir}/react.ts`,
                    },
                    {
                        find: 'react-native',
                        replacement: `${ShimsDir}/react-native.ts`,
                    },
                    {
                        find: '@react-navigation/native',
                        replacement: `${ShimsDir}/@react-navigation~native.ts`,
                    },
                    {
                        find: '@react-navigation/stack',
                        replacement: `${ShimsDir}/@react-navigation~stack.ts`,
                    },
                    {
                        find: '@shopify/flash-list',
                        replacement: `${ShimsDir}/@shopify~flash-list.ts`,
                    },
                ],
            }),
            importGlobPlugin(),
            swcPlugin(),
            hermesCPlugin({
                flags: [
                    dev ? '-Og' : '-O',
                    dev ? '-g3' : '-g1',
                    '-reuse-prop-cache',
                    '-optimized-eval',
                    '-strict',
                    '-finline',
                ],
                before(ver) {
                    if (log) {
                        console.debug(
                            chalk.cyanBright(
                                '\u{1F5CE} JS compilation finished...',
                            ),
                        )

                        console.debug(
                            chalk.gray(
                                `\u{1F5CE} Compiling bytecode with ${ver}...`,
                            ),
                        )
                    }
                },
                after() {
                    if (log)
                        console.debug(
                            chalk.cyanBright(
                                '\u{1F5CE} Bytecode compilation finished',
                            ),
                        )
                },
            }),
        ],
    })

    await bundle.write({
        minify: 'dce-only',
        exports: 'none',
        esModule: false,
        minifyInternalExports: true,
        hoistTransitiveImports: false,
        file: 'dist/revenge.js',
        format: 'iife',
    })

    if (log)
        console.info(
            chalk.greenBright(
                `\u{2714} Compiled successfully! ${chalk.gray(`(took ${(performance.now() - start).toFixed(2)}ms)`)}`,
            ),
        )
}

function swcPlugin() {
    return {
        name: 'swc',
        transform: {
            filter: {
                moduleType: ['js', 'jsx', 'ts', 'tsx'],
            },
            handler(code) {
                return transform(code, {
                    jsc: {
                        transform: {
                            react: {
                                runtime: 'automatic',
                            },
                        },
                        parser: {
                            syntax: 'typescript',
                            tsx: true,
                        },
                    },
                    env: {
                        // https://github.com/facebook/hermes/blob/main/doc/Features.md
                        targets: 'fully supports es6',
                        include: [
                            'transform-async-generator-functions',
                            'transform-block-scoping',
                            'transform-classes',
                            'transform-duplicate-named-capturing-groups-regex',
                            'transform-named-capturing-groups-regex',
                        ],
                        exclude: [
                            // Async functions are supported, only async arrow functions aren't
                            // Source: https://github.com/facebook/hermes/issues/1395
                            'transform-async-to-generator',
                            'transform-exponentiation-operator',
                            'transform-logical-assignment-operators',
                            'transform-nullish-coalescing-operator',
                            'transform-numeric-separator',
                            'transform-object-rest-spread',
                            'transform-optional-catch-binding',
                            'transform-optional-chaining',
                            'transform-parameters',
                            'transform-template-literals',
                        ],
                    },
                })
            },
        },
    } satisfies RolldownPlugin
}

async function hermesCPlugin({
    after,
    before,
    flags,
}: {
    flags?: string[]
    before?: (v: string) => void
    after?: (v: string) => void
} = {}) {
    const paths = {
        win32: 'win64-bin/hermesc.exe',
        darwin: 'osx-bin/hermesc',
        linux: 'linux64-bin/hermesc',
    }

    if (!(process.platform in paths))
        throw new Error(`Unsupported platform: ${process.platform}`)

    const sdksDir = './node_modules/react-native/sdks'
    const binPath = `${sdksDir}/hermesc/${paths[process.platform as keyof typeof paths]}`

    if (!existsSync(binPath))
        throw new Error(
            `Hermes compiler not found at ${binPath}. Please ensure you have react-native installed.`,
        )

    const ver = await Bun.file(`${sdksDir}/.hermesversion`).text()

    return {
        name: 'hermesc',
        generateBundle(_, bundle) {
            if (before) before(ver)

            const file = bundle['revenge.js'] as OutputChunk
            if (!file || !file.code) throw new Error('No code to compile')

            // TODO(scripts/build): Remove this when we have a better way to add sourceURL
            file.code += `//# sourceURL=Revenge`

            const cmdlist = [binPath, '-emit-binary', ...(flags ?? [])]

            const cmd = Bun.spawnSync<'pipe', 'pipe'>(cmdlist, {
                // @ts-expect-error: Types are incorrect, but this works
                stdin: new Blob([file.code]),
                stdout: 'pipe',
            })

            if (cmd.exitCode) {
                if (cmd.stderr.length)
                    throw new Error(
                        `Got error from hermesc: ${cmd.stderr.toString()}`,
                    )
                else
                    throw new Error(`hermesc exited with code: ${cmd.exitCode}`)
            }

            const buf = cmd.stdout
            if (!buf.length)
                throw new Error(
                    `No output from hermesc. Probably a compilation error.\nTry running the command manually: ${cmdlist.join(' ')}`,
                )

            this.emitFile({
                type: 'asset',
                fileName: `${file.fileName.split('.')[0]!}.bundle`,
                source: buf,
            })

            if (after) after(ver)
        },
    } satisfies RolldownPlugin
}

async function generateAssets() {
    if (!(await exists(GeneratedAssetsDir)))
        await mkdir(GeneratedAssetsDir, { recursive: true })

    const promises: Promise<void>[] = []

    for (const file of await readdir(AssetsDir)) {
        const { name, ext } = parse(file)
        const path = `${AssetsDir}/${file}`
        const path2 = `${GeneratedAssetsDir}/${name}.js`

        if (await exists(path2)) continue

        // We attempt to sanitize the path, but not the name as it should fail if name contains invalid characters
        const uriPath = JSON.stringify(path)
        const type = JSON.stringify(ext.slice(1))

        promises.push(
            writeFile(
                path2,
                `import{registerAsset}from'@revenge-mod/assets';import uri from${uriPath};const ${name}=registerAsset({name:'${name}',type:${type},uri});export { ${name} as default }`,
            ),
        )
    }

    await Promise.all(promises)
}
