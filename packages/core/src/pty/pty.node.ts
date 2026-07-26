import type { Opts, Proc } from "./pty"

export type { Disp, Exit, Opts, Proc } from "./pty"

let ptyModule: typeof import("@lydell/node-pty") | undefined

function loadPty(): typeof import("@lydell/node-pty") {
  if (ptyModule) return ptyModule
  try {
    ptyModule = require("@lydell/node-pty")
    return ptyModule!
  } catch (err) {
    const platform = process.platform
    const arch = process.arch
    try {
      ptyModule = require(`@lydell/node-pty-${platform}-${arch}`)
      return ptyModule!
    } catch {
      throw err
    }
  }
}

export function spawn(file: string, args: string[], opts: Opts): Proc {
  const pty = loadPty()
  const proc = pty.spawn(file, args, opts)
  return {
    pid: proc.pid,
    onData(listener) {
      return proc.onData(listener)
    },
    onExit(listener) {
      return proc.onExit(listener)
    },
    write(data) {
      proc.write(data)
    },
    resize(cols, rows) {
      proc.resize(cols, rows)
    },
    kill(signal) {
      proc.kill(signal)
    },
  }
}
