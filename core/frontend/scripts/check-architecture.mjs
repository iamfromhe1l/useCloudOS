import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
const root = path.resolve('src')
const files = []
function scan(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const filename = path.join(folder, entry.name)
    if (entry.isDirectory()) scan(filename)
    else if (/\.tsx?$/.test(filename) && !/\.test\.|\.d\.ts$/.test(filename)) files.push(filename)
  }
}
scan(root)
const graph = new Map()
function resolve(source, specifier) {
  const base = specifier.startsWith('@/')
    ? path.join(root, specifier.slice(2))
    : specifier.startsWith('.')
      ? path.resolve(path.dirname(source), specifier)
      : undefined
  if (!base) return undefined
  return [
    base + '.ts',
    base + '.tsx',
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ].find((filename) => files.includes(filename))
}
for (const filename of files) {
  const parsed = ts.createSourceFile(
    filename,
    fs.readFileSync(filename, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )
  const edges = []
  function visit(node) {
    let specifier
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const typeOnly = ts.isImportDeclaration(node)
        ? node.importClause?.isTypeOnly
        : node.isTypeOnly
      if (!typeOnly) specifier = node.moduleSpecifier.text
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    )
      specifier = node.arguments[0].text
    if (specifier) {
      const target = resolve(filename, specifier)
      if (target) edges.push(target)
    }
    ts.forEachChild(node, visit)
  }
  visit(parsed)
  graph.set(filename, edges)
}
const completed = new Set()
const active = new Set()
function check(filename, chain = []) {
  if (active.has(filename))
    throw new Error(
      'Runtime import cycle: ' +
        [...chain, filename].map((item) => path.relative(root, item)).join(' → '),
    )
  if (completed.has(filename)) return
  active.add(filename)
  for (const dependency of graph.get(filename) ?? []) check(dependency, [...chain, filename])
  active.delete(filename)
  completed.add(filename)
}
for (const filename of files) check(filename)
console.log('Architecture graph: ' + files.length + ' modules, no runtime cycles')
