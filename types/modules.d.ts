// This has to be in a separate file to be picked up by TypeScript

declare module '*.webp' {
    const src: string
    export default src
}
