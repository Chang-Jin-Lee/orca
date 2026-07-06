// Minimal purpose-built NDJSON client for the daemon wire protocol.
//
// Deliberately standalone (no electron / src imports) so the spike runs under
// plain node. Mirrors the handshake in src/main/daemon/daemon-server.ts:
//   1. read the token the server wrote to <tokenPath> after it began listening
//   2. control socket: send hello {role:'control'}, await {type:'hello',ok:true}
//   3. stream socket:  send hello {role:'stream'} with the SAME clientId
//   4. createOrAttach on control, then write() input, read 'data' events on stream

import { connect } from 'node:net'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

function encodeNdjson(msg) {
  return `${JSON.stringify(msg)}\n`
}

// Split incoming bytes on newlines and dispatch each complete JSON line.
function makeLineReader(onMessage) {
  let buffer = ''
  return (chunk) => {
    buffer += chunk.toString('utf8')
    let idx = buffer.indexOf('\n')
    while (idx !== -1) {
      const line = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 1)
      if (line.length > 0) {
        onMessage(JSON.parse(line))
      }
      idx = buffer.indexOf('\n')
    }
  }
}

function connectSocket(socketPath, timeoutMs) {
  return new Promise((resolve, reject) => {
    const socket = connect(socketPath)
    const timer = setTimeout(() => {
      socket.destroy()
      reject(new Error(`connect timeout after ${timeoutMs}ms: ${socketPath}`))
    }, timeoutMs)
    socket.once('connect', () => {
      clearTimeout(timer)
      resolve(socket)
    })
    socket.once('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

// Send a hello and resolve once the server accepts (or reject on rejection).
function handshake(socket, hello) {
  return new Promise((resolve, reject) => {
    const read = makeLineReader((msg) => {
      if (msg.type === 'hello') {
        if (msg.ok) {
          resolve(read)
        } else {
          reject(new Error(`hello rejected: ${msg.error}`))
        }
      }
    })
    socket.on('data', read)
    socket.write(encodeNdjson(hello))
  })
}

/**
 * Connect a control+stream client, create a session, write `command\r\n`, and
 * resolve once `expectRe` matches the accumulated PTY output (or reject on
 * timeout). Returns { output } on success. Always tears down its sockets.
 */
export async function runPtyEcho(options) {
  const {
    socketPath,
    tokenPath,
    protocolVersion,
    command,
    expectRe,
    connectTimeoutMs = 5000,
    ioTimeoutMs = 20000
  } = options

  const token = readFileSync(tokenPath, 'utf8').trim()
  const clientId = randomUUID()
  const sessionId = `spike-${randomUUID()}`

  const control = await connectSocket(socketPath, connectTimeoutMs)
  const stream = await connectSocket(socketPath, connectTimeoutMs)
  const teardown = () => {
    control.destroy()
    stream.destroy()
  }

  try {
    const controlRead = await handshake(control, {
      type: 'hello',
      version: protocolVersion,
      token,
      clientId,
      role: 'control'
    })
    await handshake(stream, {
      type: 'hello',
      version: protocolVersion,
      token,
      clientId,
      role: 'stream'
    })

    // Route control RPC responses by id.
    const pending = new Map()
    control.removeAllListeners('data')
    control.on(
      'data',
      makeLineReader((msg) => {
        if (msg.id && pending.has(msg.id)) {
          const { resolve, reject } = pending.get(msg.id)
          pending.delete(msg.id)
          if (msg.ok) {
            resolve(msg.payload)
          } else {
            reject(new Error(msg.error))
          }
        }
      })
    )
    // The initial controlRead consumed only the hello; discard it now.
    void controlRead

    const rpc = (type, payload) => {
      const id = randomUUID()
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject })
        control.write(encodeNdjson({ id, type, payload }))
      })
    }

    return await new Promise((resolve, reject) => {
      let output = ''
      const timer = setTimeout(() => {
        reject(new Error(`pty echo timeout after ${ioTimeoutMs}ms; output so far:\n${output}`))
      }, ioTimeoutMs)

      stream.removeAllListeners('data')
      stream.on(
        'data',
        makeLineReader((msg) => {
          if (msg.type === 'event' && msg.event === 'data' && msg.sessionId === sessionId) {
            output += msg.payload.data
            if (expectRe.test(output)) {
              clearTimeout(timer)
              resolve({ output })
            }
          }
        })
      )

      rpc('createOrAttach', { sessionId, cols: 120, rows: 30 })
        .then(() => rpc('write', { sessionId, data: `${command}\r\n` }))
        .catch((err) => {
          clearTimeout(timer)
          reject(err)
        })
    })
  } finally {
    teardown()
  }
}
