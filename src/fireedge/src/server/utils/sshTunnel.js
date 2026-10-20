/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
const { defaults } = require('server/utils/constants')
const { defaultEmptyFunction } = defaults
const { spawn } = require('child_process')
const { existsSync, mkdtempSync, rmdirSync, unlinkSync } = require('fs')
const { createServer, isIP } = require('net')
const { tmpdir } = require('os')
const { join } = require('path')

const internalHost = '127.0.0.1'
const controlCheckInterval = 50
const controlCommandTimeout = 2000
const tunnelTimeout = 10000
const maxErrorLength = 4096
const maxTcpPort = 65535
const exclusiveMaxTcpPort = maxTcpPort + 1
const hostnamePattern =
  /^(?=.{1,253}\.?$)(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)*[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.?$/i

const activeTunnels = new Map()
const allocatedPorts = new Set()

process.once('exit', () => {
  activeTunnels.forEach((tunnel) => {
    if (
      tunnel.sshProcess.exitCode === null &&
      tunnel.sshProcess.signalCode === null
    ) {
      tunnel.sshProcess.kill()
    }
    cleanupControlDirectory(tunnel)
  })
})

/**
 * Check if a port is available on the address used by Guacamole.
 *
 * @param {number} port - Port.
 * @returns {Promise<boolean>} - Resolves to true if the port is available.
 */
const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const server = createServer()

    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    server.listen(port, internalHost)
  })

/**
 * Validate and normalize a TCP port range.
 *
 * @param {Array} rangePorts - First and last port in the range.
 * @returns {number[]} - Normalized range.
 */
const normalizePortRange = (rangePorts = []) => {
  const [start, configuredEnd] = rangePorts.map(Number)
  // OpenNebula historically allows 65536 as the exclusive upper boundary in
  // VNC_PORTS. Translate that sentinel to the highest valid TCP port.
  const end = configuredEnd === exclusiveMaxTcpPort ? maxTcpPort : configuredEnd
  const validPort = (port) =>
    Number.isInteger(port) && port > 0 && port <= maxTcpPort

  if (!validPort(start) || !validPort(end) || start > end) {
    throw new Error('Invalid SSH tunnel port range.')
  }

  return [start, end]
}

/**
 * Normalize and validate an SSH forwarding destination.
 *
 * IPv6 addresses must be enclosed in brackets in an OpenSSH -L forwarding
 * specification so their colons are not interpreted as field separators.
 *
 * @param {string} address - Destination hostname or IP address.
 * @returns {string} - Destination suitable for an OpenSSH -L specification.
 * @throws {Error} - If the destination is not a valid hostname or IP address.
 */
const normalizeTargetAddress = (address) => {
  const target = String(address ?? '').trim()
  const unwrappedTarget =
    target.startsWith('[') && target.endsWith(']')
      ? target.slice(1, -1)
      : target
  const ipVersion = isIP(unwrappedTarget)

  if (ipVersion === 6) return `[${unwrappedTarget}]`
  if (ipVersion === 4 || hostnamePattern.test(unwrappedTarget)) {
    return unwrappedTarget
  }

  throw new Error('Invalid SSH tunnel target address.')
}

/**
 * Remove the private SSH control socket and its directory.
 *
 * @param {object} tunnel - Tunnel data.
 * @param {string} tunnel.controlPath - Private control socket path.
 * @param {string} tunnel.controlDirectory - Private control socket directory.
 */
function cleanupControlDirectory({ controlPath, controlDirectory }) {
  try {
    if (existsSync(controlPath)) unlinkSync(controlPath)
  } catch {}

  try {
    if (existsSync(controlDirectory)) rmdirSync(controlDirectory)
  } catch {}
}

/**
 * Stop a tunnel and release its private control socket.
 *
 * @param {object} tunnel - Tunnel data.
 * @returns {boolean} - True when the process was running.
 */
const stopTunnel = (tunnel) => {
  const { sshProcess } = tunnel
  let stopped = true

  activeTunnels.delete(sshProcess.pid)
  if (tunnel.port) allocatedPorts.delete(tunnel.port)

  if (sshProcess.exitCode === null && sshProcess.signalCode === null) {
    stopped = sshProcess.kill()
  }

  cleanupControlDirectory(tunnel)

  return stopped
}

/**
 * Run a short-lived SSH control command.
 *
 * @param {string[]} args - SSH arguments.
 * @returns {Promise<object>} - Exit status and captured output.
 */
const runSSHCommand = (args) =>
  new Promise((resolve, reject) => {
    const sshProcess = spawn('ssh', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let completed = false

    const appendOutput = (current, data) =>
      current.length >= maxErrorLength
        ? current
        : current + data.toString().slice(0, maxErrorLength - current.length)

    const finish = (callback, value) => {
      if (completed) return
      completed = true
      clearTimeout(timeout)
      callback(value)
    }

    sshProcess.stdout.on('data', (data) => {
      stdout = appendOutput(stdout, data)
    })
    sshProcess.stderr.on('data', (data) => {
      stderr = appendOutput(stderr, data)
    })
    sshProcess.once('error', (err) => finish(reject, err))
    sshProcess.once('close', (code, signal) =>
      finish(resolve, { code, signal, stdout, stderr })
    )

    const timeout = setTimeout(() => {
      sshProcess.kill()
      finish(reject, new Error('SSH control command timed out.'))
    }, controlCommandTimeout)
  })

/**
 * Delete an SSH tunnel created by this module.
 *
 * @param {number} pid - SSH process id.
 * @returns {boolean} - True when a managed tunnel was found.
 */
const deleteTunnel = (pid) => {
  const numericPid = Number(pid)
  const tunnel = activeTunnels.get(numericPid)

  if (!tunnel) return false

  return stopTunnel(tunnel)
}

/**
 * Build a dedicated SSH ControlMaster command.
 *
 * @param {object} vmParams - VM parameters.
 * @param {string} vmParams.host - Hypervisor hostname.
 * @param {string} vmParams.controlPath - Private control socket path.
 * @returns {{command: string, args: string[]}} - Command and arguments.
 */
const createCommand = ({ host, controlPath }) => ({
  command: 'ssh',
  args: [
    '-o',
    'BatchMode=yes',
    '-o',
    'ClearAllForwardings=yes',
    '-o',
    'ControlMaster=yes',
    '-S',
    controlPath,
    '-o',
    'ControlPersist=no',
    '-o',
    'ExitOnForwardFailure=yes',
    '-o',
    'ForkAfterAuthentication=no',
    '-N',
    host,
  ],
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Check that the dedicated SSH master accepts commands on its private socket.
 *
 * @param {object} tunnel - Tunnel data.
 * @returns {Promise<void>}
 */
const waitForMaster = async (tunnel) => {
  const { controlPath, host, sshProcess } = tunnel
  const deadline = Date.now() + tunnelTimeout

  while (Date.now() < deadline) {
    if (tunnel.spawnError) throw tunnel.spawnError

    if (sshProcess.exitCode !== null || sshProcess.signalCode !== null) {
      const detail = tunnel.errorOutput.trim()
      const message = `The SSH master exited before becoming ready (code: ${sshProcess.exitCode}, signal: ${sshProcess.signalCode})`

      throw new Error(detail ? `${message}: ${detail}` : message)
    }

    const result = await runSSHCommand(['-S', controlPath, '-O', 'check', host])
    if (result.code === 0) return

    await sleep(controlCheckInterval)
  }

  throw new Error(`The SSH master was not ready after ${tunnelTimeout} ms.`)
}

/**
 * Ask the dedicated master to create a local forward.
 *
 * The control command only succeeds after OpenSSH has bound the requested
 * listener. Competing tunnel requests are therefore arbitrated atomically by
 * the kernel instead of relying on a check-then-bind sequence in FireEdge.
 *
 * @param {object} tunnel - Tunnel data.
 * @param {number} dstPort - Remote VNC port.
 * @param {string} targetAddr - VNC address from the hypervisor.
 * @param {number} start - First allowed local port.
 * @param {number} end - Last allowed local port.
 * @returns {Promise<number>} - Bound local port.
 */
const createForward = async (tunnel, dstPort, targetAddr, start, end) => {
  const { controlPath, host, sshProcess } = tunnel
  let lastError = ''

  for (let port = start; port <= end; port++) {
    if (allocatedPorts.has(port) || !(await isPortAvailable(port))) continue
    if (allocatedPorts.has(port)) continue

    allocatedPorts.add(port)

    const forward = `${internalHost}:${port}:${targetAddr}:${dstPort}`
    let result

    try {
      result = await runSSHCommand([
        '-S',
        controlPath,
        '-O',
        'forward',
        '-L',
        forward,
        host,
      ])
    } catch (err) {
      allocatedPorts.delete(port)
      throw err
    }

    if (result.code === 0) {
      let forwardMasterStatus

      try {
        forwardMasterStatus = await runSSHCommand([
          '-S',
          controlPath,
          '-O',
          'check',
          host,
        ])
      } catch (err) {
        allocatedPorts.delete(port)
        throw err
      }

      if (
        forwardMasterStatus.code === 0 &&
        sshProcess.exitCode === null &&
        sshProcess.signalCode === null &&
        !(await isPortAvailable(port))
      ) {
        return port
      }

      allocatedPorts.delete(port)
      throw new Error('The SSH master stopped after creating the forward.')
    }

    allocatedPorts.delete(port)
    lastError = result.stderr.trim()

    const masterStatus = await runSSHCommand([
      '-S',
      controlPath,
      '-O',
      'check',
      host,
    ])
    if (masterStatus.code !== 0) {
      throw new Error(lastError || 'The SSH master is no longer available.')
    }
  }

  const message = 'No available ports were found in the specified range.'

  throw new Error(lastError ? `${message} ${lastError}` : message)
}

/**
 * Start and register an SSH tunnel.
 *
 * @param {object} params - Tunnel parameters.
 * @param {string} params.host - Hypervisor hostname.
 * @param {string} params.targetAddr - VNC address from the hypervisor.
 * @param {number} params.dstPort - Remote VNC port.
 * @param {number} params.start - First allowed local port.
 * @param {number} params.end - Last allowed local port.
 * @returns {Promise<object>} - SSH process id and bound local port.
 */
const startSSHTunnel = async ({ host, targetAddr, dstPort, start, end }) => {
  const controlDirectory = mkdtempSync(join(tmpdir(), 'fireedge-ssh-'))
  const controlPath = join(controlDirectory, 'control')
  const { command, args } = createCommand({ host, controlPath })
  const sshProcess = spawn(command, args, {
    stdio: ['ignore', 'ignore', 'pipe'],
  })
  const tunnel = {
    controlDirectory,
    controlPath,
    errorOutput: '',
    host,
    spawnError: null,
    sshProcess,
  }

  sshProcess.stderr.on('data', (data) => {
    if (tunnel.errorOutput.length >= maxErrorLength) return
    tunnel.errorOutput += data
      .toString()
      .slice(0, maxErrorLength - tunnel.errorOutput.length)
  })
  sshProcess.once('error', (err) => {
    tunnel.spawnError = err
  })
  sshProcess.once('close', () => {
    cleanupControlDirectory(tunnel)
  })

  try {
    await waitForMaster(tunnel)
    const port = await createForward(tunnel, dstPort, targetAddr, start, end)

    tunnel.port = port
    activeTunnels.set(sshProcess.pid, tunnel)

    return { pid: sshProcess.pid, port }
  } catch (err) {
    stopTunnel(tunnel)
    throw err
  }
}

/**
 * Create a dedicated SSH tunnel to Guacamole.
 *
 * @param {object} vmParams - VM parameters.
 * @param {string|number} vmParams.vmPort - VM graphics port.
 * @param {string} vmParams.hostAddr - Hypervisor hostname.
 * @param {string} vmParams.targetAddr - Graphics address from the hypervisor.
 * @param {object} vmParams.settings - Guacamole connection settings.
 * @param {Array} vmParams.rangePorts - Allowed local port range.
 * @param {object} callbacks - Optional compatibility callbacks.
 * @param {Function} callbacks.connect - Called after the tunnel is ready.
 * @param {Function} callbacks.error - Called if tunnel creation fails.
 * @returns {Promise<number>} - SSH process id.
 */
const create = async (
  { vmPort, hostAddr, targetAddr = internalHost, settings = {}, rangePorts },
  { connect = defaultEmptyFunction, error = defaultEmptyFunction } = {}
) => {
  let pid

  try {
    const dstPort = Number(vmPort)
    if (!Number.isInteger(dstPort) || dstPort <= 0 || dstPort > maxTcpPort) {
      throw new Error('Invalid SSH tunnel destination port.')
    }
    if (typeof hostAddr !== 'string' || !hostAddr || hostAddr.startsWith('-')) {
      throw new Error('Invalid SSH tunnel host.')
    }
    const normalizedTargetAddr = normalizeTargetAddress(targetAddr)

    const [start, end] = normalizePortRange(rangePorts)
    const tunnel = await startSSHTunnel({
      dstPort,
      host: hostAddr,
      start,
      targetAddr: normalizedTargetAddr,
      end,
    })
    pid = tunnel.pid

    if (!settings.connection) settings.connection = {}
    settings.connection.port = tunnel.port
    settings.connection.hostname = internalHost
    connect(pid)

    return pid
  } catch (err) {
    if (pid) deleteTunnel(pid)
    error(err)
    throw err
  }
}

module.exports = {
  create,
  deleteTunnel,
}
