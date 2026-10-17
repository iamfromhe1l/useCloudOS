import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import hooks from 'eslint-plugin-react-hooks'
import a11y from 'eslint-plugin-jsx-a11y'
import sort from 'eslint-plugin-simple-import-sort'
import unused from 'eslint-plugin-unused-imports'
import prettier from 'eslint-config-prettier'
import path from 'node:path'
const layers = ['shared', 'entities', 'features', 'widgets', 'pages', 'app']
const architecture = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      boundary:
        'FSD: import only lower layers; use public APIs and keep relative imports inside your slice.',
      colors: 'Feature UI must use semantic color roles. Put seed definitions in shared/config.',
    },
  },
  create(context) {
    const filename = context.filename.replaceAll('\\\\', '/')
    const relative = filename.split('/src/')[1]
    if (!relative) return {}
    const [layer, slice] = relative.split('/')
    const sourceRank = layers.indexOf(layer)
    function check(node, specifier) {
      if (typeof specifier === 'string') {
        const target = specifier.startsWith('.')
          ? path.resolve(path.dirname(filename), specifier)
          : specifier
        const crossPrivate =
          (filename.includes('/core/frontend/') &&
            (target.includes('/apps/') ||
              (/^@usecloud\//.test(specifier) &&
                !/^@usecloud\/(ui|theme|app-sdk|manifest|tooling)(\/|$)/.test(specifier)))) ||
          (filename.includes('/apps/') && target.includes('/core/')) ||
          (filename.includes('/packages/') &&
            (target.includes('/core/') || target.includes('/apps/')))
        const packageDeep =
          specifier.startsWith('@usecloud/') &&
          specifier.split('/').length > 2 &&
          !/^@usecloud\/(app-sdk\/react|ui\/(selection|css|overlays)|theme\/(css|tailwind|typography)|manifest\/schema)$/.test(
            specifier,
          )
        if (crossPrivate || packageDeep) context.report({ node, messageId: 'boundary' })
      }
      if (sourceRank < 0 || typeof specifier !== 'string') return
      if (specifier.startsWith('../')) {
        const target = path
          .resolve(path.dirname(filename), specifier)
          .replaceAll('\\\\', '/')
          .split('/src/')[1]
        if (target && !target.startsWith(layer + '/' + slice + '/'))
          context.report({ node, messageId: 'boundary' })
      }
      if (!specifier.startsWith('@/')) return
      const [targetLayer, targetSlice, ...rest] = specifier.slice(2).split('/')
      const targetRank = layers.indexOf(targetLayer)
      const upwards = targetRank > sourceRank
      const sideways =
        targetRank === sourceRank && layer !== 'app' && layer !== 'shared' && targetSlice !== slice
      const internal = targetLayer !== 'shared' && targetLayer !== 'app' && rest.length > 0
      if (upwards || sideways || internal) context.report({ node, messageId: 'boundary' })
    }
    return {
      ImportDeclaration(node) {
        check(node, node.source.value)
      },
      ExportNamedDeclaration(node) {
        if (node.source) check(node, node.source.value)
      },
      ExportAllDeclaration(node) {
        check(node, node.source.value)
      },
      ImportExpression(node) {
        if (node.source.type === 'Literal') check(node, node.source.value)
      },
      Literal(node) {
        if (
          layer === 'features' &&
          typeof node.value === 'string' &&
          /^#[0-9a-f]{3,8}$/i.test(node.value)
        )
          context.report({ node, messageId: 'colors' })
      },
    }
  },
}
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/storybook-static/**',
      '**/test-results/**',
      '**/playwright-report/**',
      '**/node_modules/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  a11y.flatConfigs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': hooks,
      'simple-import-sort': sort,
      'unused-imports': unused,
      fsd: { rules: { boundaries: architecture } },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'fsd/boundaries': 'error',
      'max-lines': ['warn', { max: 250, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly', Buffer: 'readonly', URL: 'readonly' },
    },
  },
  prettier,
)
