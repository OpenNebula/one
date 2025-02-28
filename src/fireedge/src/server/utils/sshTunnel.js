/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
const { execSync, spawn } = require('child_process')
const { createServer } = require('net')

let PID = null
const internalHost = '127.0.0.1'

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
    console.log(err)
  }
}

/**
 * Valid if the tunnel is started.
 *
 * @param {object} vmParams - vm params
 * @param {string} vmParams.dstPort - external port
 * @param {Function} error - callback if exist a error
 * @returns {number | null} if exists returns the PID
 */
const validateSSHTunnelStarted = ({ dstPort }, error) => {
  try {
    const output = execSync(
      `ps -ef | grep "[s]sh.*:${internalHost}:${dstPort}" | awk '{print $2}'`,
      { encoding: 'utf-8' }
    )

    const cleanOutput = output.trim()

    return cleanOutput ? parseInt(cleanOutput, 10) : null
  } catch (err) {
    error(err)

    return null
  }
}

/**
 * Creates the command for the tunnel.
 *
 * @param {object} vmParams - vm params
 * @param {string} vmParams.srcPort - internal port
 * @param {string} vmParams.dstPort - external port
 * @param {string} vmParams.host - external host
 * @returns {string} command
 */
const createCommand = ({ srcPort, dstPort, host }) => {
  const command = 'bash'
  const commandArg = ['-c']

  const commandSSH = 'ssh'
  const args = [
    '-N',
    '-L',
    `${srcPort}:${internalHost}:${dstPort}`,
    `${host}`,
    '& echo $!',
  ]

  return { command, args: [...commandArg, [commandSSH, ...args].join(' ')] }
}

/**
 * Time to wait for the tunnel to be finished creating.
 *
 * @param {number} ms - time to wait
 * @returns {Promise} promise
 */
const sleep = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Creates the tunnel SSH.
 *
 * @param {object} params - params
 * @param {string} params.command - command for tunnel
 * @param {string} params.args - args for tunnel
 * @returns {Promise} promise
 */
const startSSHTunnel = async ({ command, args }) =>
  new Promise((resolve, reject) => {
    const sshProcess = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    sshProcess.stdout.on('data', (data) => {
      const cleanOutput = data.toString().trim()
      PID = parseInt(cleanOutput, 10)
      resolve(PID)
    })

    sshProcess.stderr.on('data', (data) => {
      if (data.toString().includes('already in use')) {
        deleteTunnel(PID)
        reject(new Error('The port is already in use.'))
      }
    })

    sshProcess.on('close', (code) => {
      if (code !== 0 && PID) {
        deleteTunnel(PID)
        reject(new Error(`The SSH process ended with code: ${code}`))
      }
    })
  })

/**
 * Create a SSH tunnel to Guacamole.
 *
 * @param {object} vmParams - vm params
 * @param {string} vmParams.vmPort - graphics port. vmInfo.TEMPLATE?.GRAPHICS?.PORT
 * @param {string} vmParams.hostAddr - graphics hostname
 * @param {object} vmParams.settings - settings guacamole console
 * @param {Array} vmParams.rangePorts - range vnc ports
 * @param {object} callbacks - callbacks
 * @param {Function} callbacks.connect - connect callback
 * @param {Function} callbacks.error - error callback
 */
const create = async (
  { vmPort, hostAddr, settings = {}, rangePorts },
  { connect = defaultEmptyFunction, error = defaultEmptyFunction } = {}
) => {
  const paramsCommands = {
    srcPort: vmPort,
    dstPort: vmPort,
    host: hostAddr,
  }

  const pidTunnelStarted = validateSSHTunnelStarted(paramsCommands, error)
  if (!pidTunnelStarted) {
    const availablePort = await findAvailablePortInRange(
      rangePorts[0],
      rangePorts[1]
    )
    if (availablePort) {
      paramsCommands.srcPort = availablePort
      settings.connection.port = availablePort
      try {
        const command = createCommand(paramsCommands)
        const pid = await startSSHTunnel(command)
        await sleep()
        connect(pid)
      } catch (err) {
        error(err)
      }
    } else {
      error(new Error('No available ports were found in the specified range.'))
    }
  } else {
    connect(pidTunnelStarted)
  }
}

module.exports = {
  create,
  deleteTunnel,
}
