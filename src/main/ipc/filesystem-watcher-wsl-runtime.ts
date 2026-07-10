import { execFile, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

type WslWatcherManifest = {
  protocol: 1
  installLayout: 1
  nodeVersion: string
  bundleVersion: string
}

export type InstalledWslWatcherRuntime = {
  nodePath: string
  hostPath: string
}

const execFileAsync = promisify(execFile)
const installationPromises = new Map<string, Promise<InstalledWslWatcherRuntime>>()
const runningQueries = new Map<string, Promise<boolean>>()

const INSTALL_SCRIPT = String.raw`
set -efu
bundle_windows=$1
version=$2
node_version=$3
case "$(uname -m)" in
  x86_64) arch=x64 ;;
  aarch64|arm64) arch=arm64 ;;
  *) echo "unsupported WSL architecture: $(uname -m)" >&2; exit 70 ;;
esac
if ! getconf GNU_LIBC_VERSION >/dev/null 2>&1; then
  echo "managed WSL watcher requires a glibc distro" >&2
  exit 71
fi
bundle_linux=$(wslpath -u "$bundle_windows")
archive="$bundle_linux/$arch/node.tar.xz"
watcher="$bundle_linux/$arch/watcher.node"
host="$bundle_linux/host.js"
watcher_license="$bundle_linux/parcel-watcher-LICENSE"
test -f "$archive" && test -f "$watcher" && test -f "$host" && test -f "$watcher_license"
base="$HOME/.local/share/orca/wsl-watcher"
install="$base/$version/$arch"
complete="$install/.complete"
if test -x "$install/node" && test -f "$complete"; then
  printf '%s\n%s\n' "$install/node" "$install/host.js"
  exit 0
fi
mkdir -p "$base/$version"
lock="$base/$version/.install-$arch.lock"
attempt=0
while ! mkdir "$lock" 2>/dev/null; do
  if test -r "$lock/pid"; then
    owner=$(cat "$lock/pid" 2>/dev/null || true)
    if test -n "$owner" && ! kill -0 "$owner" 2>/dev/null; then
      rm -rf -- "$lock"
      continue
    fi
  fi
  if test -x "$install/node" && test -f "$complete"; then
    printf '%s\n%s\n' "$install/node" "$install/host.js"
    exit 0
  fi
  attempt=$((attempt + 1))
  test "$attempt" -lt 300 || { echo "timed out waiting for WSL watcher install" >&2; exit 72; }
  sleep 0.1
done
printf '%s\n' "$$" >"$lock/pid"
if test -x "$install/node" && test -f "$complete"; then
  rm -rf -- "$lock"
  printf '%s\n%s\n' "$install/node" "$install/host.js"
  exit 0
fi
stage="$base/version-$version-$arch-$$.tmp"
cleanup() { rm -rf -- "$stage" "$lock"; }
trap cleanup EXIT HUP INT TERM
rm -rf -- "$stage"
mkdir -p "$stage"
tar -xJf "$archive" -C "$stage" --strip-components=2 \
  "node-v$node_version-linux-$arch/bin/node"
tar -xJf "$archive" -C "$stage" --strip-components=1 \
  "node-v$node_version-linux-$arch/LICENSE"
cp "$host" "$stage/host.js"
cp "$watcher" "$stage/watcher.node"
cp "$watcher_license" "$stage/parcel-watcher-LICENSE"
chmod 700 "$stage/node" "$stage/host.js"
"$stage/node" "$stage/host.js" --check >/dev/null
printf '%s\n' "$version" >"$stage/.complete"
rm -rf -- "$install"
mv "$stage" "$install"
printf '%s\n%s\n' "$install/node" "$install/host.js"
`

function resolveBundlePath(): string {
  if (process.resourcesPath) {
    const packaged = join(process.resourcesPath, 'wsl-watcher')
    if (existsSync(packaged)) {
      return packaged
    }
  }
  const development = resolve(process.cwd(), 'out', 'wsl-watcher')
  if (existsSync(development)) {
    return development
  }
  // In development __dirname is out/main and the prepared bundle is out/wsl-watcher.
  return resolve(__dirname, '..', 'wsl-watcher')
}

function validateManifest(value: unknown): WslWatcherManifest {
  const manifest = value as Partial<WslWatcherManifest>
  if (
    manifest?.protocol !== 1 ||
    manifest.installLayout !== 1 ||
    typeof manifest.nodeVersion !== 'string' ||
    !/^\d+\.\d+\.\d+$/.test(manifest.nodeVersion) ||
    typeof manifest.bundleVersion !== 'string' ||
    !/^[a-f0-9]{20}$/.test(manifest.bundleVersion)
  ) {
    throw new Error('Invalid managed WSL watcher manifest')
  }
  return manifest as WslWatcherManifest
}

async function installRuntime(distro: string): Promise<InstalledWslWatcherRuntime> {
  const bundlePath = resolveBundlePath()
  const manifest = validateManifest(
    JSON.parse(await readFile(join(bundlePath, 'manifest.json'), 'utf8')) as unknown
  )
  const stdout = await runInstaller(distro, [
    bundlePath,
    manifest.bundleVersion,
    manifest.nodeVersion
  ])
  const [nodePath, hostPath] = stdout
    .replaceAll(String.fromCharCode(0), '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (!nodePath?.startsWith('/') || !hostPath?.startsWith('/')) {
    throw new Error('Managed WSL watcher installer returned invalid paths')
  }
  return { nodePath, hostPath }
}

function runInstaller(distro: string, args: string[]): Promise<string> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('wsl.exe', ['-d', distro, '--exec', 'sh', '-s', '--', ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    })
    let stdout = ''
    let stderr = ''
    let settled = false
    const settle = (error?: Error): void => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timer)
      if (error) {
        rejectPromise(error)
      } else {
        resolvePromise(stdout)
      }
    }
    const timer = setTimeout(() => {
      child.kill()
      settle(new Error(`Timed out installing managed WSL watcher for ${distro}`))
    }, 120_000)
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
      if (stdout.length > 64 * 1024) {
        child.kill()
        settle(new Error('Managed WSL watcher installer produced too much output'))
      }
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr = (stderr + chunk.toString('utf8')).slice(-4096)
    })
    child.once('error', (error) => settle(error))
    child.once('close', (code, signal) => {
      if (code === 0) {
        settle()
      } else {
        settle(
          new Error(
            `Managed WSL watcher install failed (${code ?? signal})${stderr.trim() ? `: ${stderr.trim()}` : ''}`
          )
        )
      }
    })
    child.stdin.once('error', (error) => settle(error))
    child.stdin.end(INSTALL_SCRIPT)
  })
}

export function ensureWslWatcherRuntime(distro: string): Promise<InstalledWslWatcherRuntime> {
  let pending = installationPromises.get(distro)
  if (!pending) {
    pending = installRuntime(distro).catch((error) => {
      installationPromises.delete(distro)
      throw error
    })
    installationPromises.set(distro, pending)
  }
  return pending
}

async function queryWslDistroRunning(distro: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('wsl.exe', ['--list', '--running', '--quiet'], {
      encoding: 'utf8',
      timeout: 5_000,
      maxBuffer: 64 * 1024
    })
    return parseRunningWslDistros(stdout).some(
      (runningDistro) => runningDistro.toLowerCase() === distro.toLowerCase()
    )
  } catch {
    return false
  }
}

export function parseRunningWslDistros(output: string): string[] {
  return output
    .replaceAll(String.fromCharCode(0), '')
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\*\s*/, ''))
    .filter(Boolean)
}

export function isWslDistroRunning(distro: string): Promise<boolean> {
  let pending = runningQueries.get(distro)
  if (!pending) {
    pending = queryWslDistroRunning(distro).finally(() => runningQueries.delete(distro))
    runningQueries.set(distro, pending)
  }
  return pending
}

export function resetWslWatcherRuntimeForTest(): void {
  installationPromises.clear()
  runningQueries.clear()
}

export { INSTALL_SCRIPT }
