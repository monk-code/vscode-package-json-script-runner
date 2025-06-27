import { build } from 'esbuild'

const watch = process.argv.includes('--watch')

const buildOptions = {
  entryPoints: ['src/extension/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  sourcemap: true,
  external: ['vscode'],
  loader: {
    '.ts': 'ts'
  },
  logLevel: 'info',
  minify: process.env.NODE_ENV === 'production'
}

if (watch) {
  const ctx = await build({
    ...buildOptions,
    plugins: [{
      name: 'watch-notifier',
      setup(build) {
        build.onEnd(result => {
          if (result.errors.length === 0) {
            console.log('[esbuild] Build completed successfully')
          }
        })
      }
    }]
  })
  
  await ctx.watch()
  console.log('[esbuild] Watching for changes...')
} else {
  await build(buildOptions)
}