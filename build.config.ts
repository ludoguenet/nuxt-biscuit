import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/module'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: false,
    esbuild: {
      target: 'node18',
      format: 'esm',
    },
  },
  failOnWarn: false,
  externals: [
    '@nuxt/kit',
    '@nuxt/schema',
    'defu',
  ],
})
