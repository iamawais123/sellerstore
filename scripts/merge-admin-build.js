// Copies the built admin-dashboard and super-admin-dashboard apps into dist/admin-app and
// dist/super-admin-app so a single static host can serve all three apps from one origin
// (required for a super admin's / admin's Firebase session to be visible to the app they
// open via "log in as admin" / "log in as seller").
import { cpSync, existsSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

const apps = [
  { name: 'admin-dashboard', target: 'admin-app' },
  { name: 'super-admin-dashboard', target: 'super-admin-app' },
]

for (const { name, target } of apps) {
  const source = join(projectRoot, name, 'dist')
  const targetDir = join(projectRoot, 'dist', target)

  if (!existsSync(source)) {
    console.error(`${name}/dist not found — run \`npm run build\` in ${name} first.`)
    process.exit(1)
  }

  rmSync(targetDir, { recursive: true, force: true })
  cpSync(source, targetDir, { recursive: true })

  console.log(`Copied ${name}/dist -> dist/${target}`)
}
