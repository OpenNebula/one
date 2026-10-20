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
const { createServer, isIP } = require('net')

const internalHost = '127.0.0.1'
const tunnelStartDelay = 1000
const hostnamePattern =
  /^(?=.{1,253}\.?$)(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)*[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.?$/i

/**
 * Check if a port is available.
 *
 * @param {number} port - Puert.
 * @returns {Promise<boolean>} - Resolves to true if the port is available, false if it is not.
 */
const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const server = createServer()
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false) // Port busy
      } else {
        console.error(
          `Unexpected error when checking the port ${port}: ${err.message}`
        )
        resolve(false)
      }
    })
    server.once('listening', () => {
      server.close(() => resolve(true)) // Port enabled
    })
    server.listen(port)
  })

/**
 * Searches for an available port within a range.
 *
 * @param {number} start - Initial Port.
 * @param {number} end - End Port.
 * @returns {Promise<number|null>} - Resolves to the first available port or null if there is none.
 */
const findAvailablePortInRange = async (start = 5900, end = 6100) => {
  for (let port = start; port <= end; port++) {
    const available = await isPortAvailable(port)
    if (available) {
      return port
    }
  }

  return null
}

/**
 * Delete a SSH tunnel to guacamole.
 *
 * @param {number} pid - process id
 */
const deleteTunnel = (pid) => {
  try {
    process.kill(pid)
  } catch (err) {
    err.code !== 'ESRCH' && console.log(err)
  }
}

/**
 * Normalizes and validates a SSH forwarding destination.
 *
 * @param {string} address - Destination hostname or IP address
 * @returns {string} Destination suitable for an OpenSSH -L specification
 * @throws {Error} If the destination is not a valid hostname or IP address
 */
const normalizeTargetAddress = (address) => {
  const target = String(address ?? '').trim()
  const unwrappedTarget =
    target.startsWith('[') && target.endsWith(']')
      ? target.slice(1, -1)
      : target
  const ipVersion = isIP(unwrappedTarget)

  if (ipVersion === 6) return '[' + unwrappedTarget + ']'
  if (ipVersion === 4 || hostnamePattern.test(unwrappedTarget)) {
    return unwrappedTarget
  }

  throw new Error('Invalid SSH tunnel target address')
}

/**
 * Creates the command for the tunnel.
 *
 * @param {object} vmParams - vm params
 * @param {string} vmParams.srcPort - internal port
 * @param {string} vmParams.dstPort - external port
 * @param {string} vmParams.host - external host
 * @param {string} vmParams.targetAddr - destination address from the external host
 * @returns {{command: string, args: string[]}} Command and arguments
 */
const createCommand = ({ srcPort, dstPort, host, targetAddr }) => {
  const destination = normalizeTargetAddress(targetAddr)
  const args = [
    '-o',
    'BatchMode=yes',
    '-o',
    'StrictHostKeyChecking=no',
    '-o',
    'UserKnownHostsFile=/dev/null',
    '-o',
    'GlobalKnownHostsFile=/dev/null',
    '-o',
    'LogLevel=ERROR',
    '-o',
    'ExitOnForwardFailure=yes',
    '-o',
    'ConnectTimeout=10',
    '-N',
    '-L',
    `${srcPort}:${destination}:${dstPort}`,
    host,
  ]

  return { command: 'ssh', args }
}

/**
 * Creates the tunnel SSH.
 *
 * @param {object} params - params
 * @param {string} params.command - command for tunnel
 * @param {string[]} params.args - args for tunnel
 * @returns {Promise} promise
 */
const startSSHTunnel = async ({ command, args }) =>
  new Promise((resolve, reject) => {
    const sshProcess = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let startupTimer
    let stderr = ''
    let settled = false

    const rejectStartup = (error) => {
      if (settled) return

      settled = true
      clearTimeout(startupTimer)
      reject(error)
    }

    sshProcess.once('spawn', () => {
      startupTimer = setTimeout(() => {
        settled = true
        resolve(sshProcess.pid)
      }, tunnelStartDelay)
    })

    sshProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    sshProcess.once('error', rejectStartup)

    sshProcess.once('close', (code) => {
      const errorMessage = stderr.trim()
      rejectStartup(
        new Error(
          errorMessage ||
            `The SSH process ended with code: ${code ?? 'unknown'}`
        )
      )
    })
  })

/**
 * Create a SSH tunnel to Guacamole.
 *
 * @param {object} vmParams - vm params
 * @param {string} vmParams.vmPort - graphics port. vmInfo.TEMPLATE?.GRAPHICS?.PORT
 * @param {string} vmParams.hostAddr - graphics hostname
 * @param {string} vmParams.targetAddr - graphics address from the hypervisor
 * @param {object} vmParams.settings - settings guacamole console
 * @param {Array} vmParams.rangePorts - range vnc ports
 * @param {object} callbacks - callbacks
 * @param {Function} callbacks.connect - connect callback
 * @param {Function} callbacks.error - error callback
 */
const create = async (
  { vmPort, hostAddr, targetAddr = internalHost, settings = {}, rangePorts },
  { connect = defaultEmptyFunction, error = defaultEmptyFunction } = {}
) => {
  const paramsCommands = {
    srcPort: vmPort,
    dstPort: vmPort,
    host: hostAddr,
    targetAddr,
  }

  const availablePort = await findAvailablePortInRange(
    rangePorts[0],
    rangePorts[1]
  )
  if (availablePort) {
    paramsCommands.srcPort = availablePort
    settings.connection.port = availablePort
    settings.connection.hostname = internalHost
    try {
      const command = createCommand(paramsCommands)
      const pid = await startSSHTunnel(command)
      connect(pid)
    } catch (err) {
      error(err)
    }
  } else {
    error(new Error('No available ports were found in the specified range.'))
  }
}

module.exports = {
  create,
  deleteTunnel,
}
