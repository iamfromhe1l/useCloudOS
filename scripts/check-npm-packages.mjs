import { spawnSync } from 'node:child_process'
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const temporary = await mkdtemp(path.join(tmpdir(), 'usecloud-pack-'))
function run(args, cwd = root) {
  const result = spawnSync('npm', args, { cwd, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(result.stderr + '\n' + result.stdout)
  return result.stdout
}
try {
  const tarballs = []
  for (const name of ['theme', 'manifest', 'app-sdk', 'ui', 'tooling']) {
    const output = JSON.parse(
      run(['pack', '--workspace', '@usecloud/' + name, '--pack-destination', temporary, '--json']),
    )
    const packed = Array.isArray(output) ? output[0] : Object.values(output)[0]
    if (
      packed.files.some(
        (file) =>
          /(^|\/)(src|test|tests|stories|storybook-static)\//.test(file.path) ||
          file.path.includes('.env'),
      )
    )
      throw new Error('Private files in ' + name)
    tarballs.push(path.join(temporary, packed.filename))
    console.log(name + ': ' + packed.files.length + ' public distribution files')
  }
  const consumer = path.join(temporary, 'external-consumer')
  await cp(path.join(root, 'examples/hello-app'), consumer, {
    recursive: true,
    filter: (source) => !/(^|\/)(node_modules|dist)(\/|$)/.test(source),
  })
  const pkg = JSON.parse(await readFile(path.join(consumer, 'package.json'), 'utf8'))
  const tooling = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf8'),
  ).devDependencies
  pkg.devDependencies = Object.fromEntries(
    [
      'vite',
      'typescript',
      '@vitejs/plugin-react',
      '@tailwindcss/vite',
      'tailwindcss',
      '@types/react',
      '@types/react-dom',
    ].map((name) => [name, tooling[name]]),
  )
  await writeFile(path.join(consumer, 'package.json'), JSON.stringify(pkg))
  run(['install', '--offline', '--ignore-scripts', '--no-audit', ...tarballs], consumer)
  console.log(run(['run', 'build'], consumer))
  const css = await readFile(path.join(consumer, 'dist/style.css'), 'utf8')
  if (
    !css.includes('--uc-primary') ||
    !css.includes('rounded-full') ||
    !css.includes('bg-surface-container')
  )
    throw new Error('Published UI styles missing')
  console.log('External tarball consumer build/styles passed without Core source imports.')
} finally {
  await rm(temporary, { recursive: true, force: true })
}
