import { main } from 'bun'
import chalk from 'chalk'
import { existsSync, readdirSync } from 'fs'
import { rm } from 'fs/promises'
import { rolldown } from 'rolldown'
import { dts } from 'rolldown-plugin-dts'
import pkg from '../package.json'
import type { Dirent } from 'fs'

const OutputDir = 'dist/types'

await rm(OutputDir, { recursive: true, force: true })
    .then(() =>
        console.debug(chalk.gray('\u{1F5BB} Deleted generated types...')),
    )
    .catch()

// If this file is being run directly, build the project
if (main === import.meta.filename) buildTypes()

function hasTypesExports(node: Dirent) {
    return (
        node.isDirectory() &&
        (existsSync(`./lib/${node.name}/src/types.ts`) ||
            existsSync(`./lib/${node.name}/src/types/index.ts`))
    )
}

export default async function buildTypes(log = true) {
    let start = performance.now()

    if (log) console.info(chalk.gray('\u{1F5CE} Generating types...'))

    const bundle = await rolldown({
        input: {
            ...Object.fromEntries(
                readdirSync('./lib', { withFileTypes: true })
                    .filter(hasTypesExports)
                    .map(node => [
                        `lib/${node.name}/types`,
                        `./lib/${node.name}/src/types`,
                    ]),
            ),
            'lib/modules/finders/filters':
                './lib/modules/src/finders/filters.ts',
            types: './types/lib.ts',
        },
        external: Object.keys({
            ...pkg.dependencies,
            ...pkg.devDependencies,
            ...pkg.peerDependencies,
        }),
        plugins: [
            dts({
                tsconfig: 'tsconfig.json',
                parallel: true,
                emitDtsOnly: true,
                eager: true,
                resolve: true,
            }),
        ],
    })

    await bundle.write({
        dir: 'dist/types',
    })

    if (log)
        console.info(
            chalk.greenBright(
                `\u{2714} Generated library types! ${chalk.gray(`(took ${(performance.now() - start).toFixed(2)}ms)`)}`,
            ),
        )

    start = performance.now()

    Bun.spawnSync({
        cmd: ['treetype', './types/lib.tt', './dist/types/modules.d.ts'],
        stdout: 'inherit',
        stderr: 'inherit',
    })

    if (log)
        console.info(
            chalk.greenBright(
                `\u{2714} Generated import types! ${chalk.gray(`(took ${(performance.now() - start).toFixed(2)}ms)`)}`,
            ),
        )
}
