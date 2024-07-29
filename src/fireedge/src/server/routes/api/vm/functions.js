/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
const { randomBytes, createCipheriv } = require('crypto')

const { defaults, httpCodes } = require('server/utils/constants')
const {
  httpResponse,
  executeCommand,
  getSunstoneAuth,
} = require('server/utils/server')
const { getSunstoneConfig } = require('server/utils/yml')
const { Actions: userActions } = require('server/utils/constants/commands/user')
const { Actions: vmActions } = require('server/utils/constants/commands/vm')
const { createTokenServerAdmin } = require('server/routes/api/auth/utils')

const { USER_INFO } = userActions
const { VM_INFO } = vmActions

const { ok, unauthorized, internalServerError, badRequest } = httpCodes
const { defaultEmptyFunction, defaultCommandVM, defaultTypeCrypto } = defaults

const appConfig = getSunstoneConfig()
const prependCommand = appConfig.sunstone_prepend || ''
const regexpSplitLine = /\r|\n/

/**
 * Save as template.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {object} userData - user of http request
 */
const saveAsTemplate = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {}
) => {
  let rtn = httpResponse(badRequest, '', '')
  const { id, name, persistent } = params
  if (id && name) {
    let message = ''
    const paramsCommand = ['save', `${id}`, `${name}`]

    if (persistent && persistent === 'true') {
      paramsCommand.push('--persistent')
    }

    const executedCommand = executeCommand(
      defaultCommandVM,
      paramsCommand,
      prependCommand
    )

    const response = executedCommand.success ? ok : internalServerError

    if (executedCommand.data) {
      message = executedCommand.data.replace(regexpSplitLine, '')
    }
    rtn = httpResponse(response, message)
  }
  res.locals.httpCode = rtn
  next()
}

/**
 * Generates a session to connect a VM by id through Guacamole.
 *
 * @param {object} res - http response
 * @param {Function} next - express stepper
 * @param {object} params - params of http request
 * @param {string} params.id - VM id
 * @param {'vnc'|'ssh'|'rdp'} params.type - Type connection
 * @param {object} userData - user of http request
 * @param {Function} xmlrpc - XML-RPC function
 */
const generateGuacamoleSession = (
  res = {},
  next = defaultEmptyFunction,
  params = {},
  userData = {},
  xmlrpc = defaultEmptyFunction
) => {
  const { id: userAuthId } = userData
  const { id: vmId, type } = params
  const ensuredType = `${type}`.toLowerCase()

  if (!['vnc', 'ssh', 'rdp'].includes(ensuredType)) {
    const messageError = "Type connection isn't supported by Guacamole"
    res.locals.httpCode = httpResponse(badRequest, messageError)
    next()
  }

  const serverAdmin = getSunstoneAuth() ?? {}
  const { token: authToken } = createTokenServerAdmin(serverAdmin) ?? {}

  if (!authToken) {
    res.locals.httpCode = httpResponse(badRequest, '')
    next()
  }

  const { username } = serverAdmin
  const oneClient = xmlrpc(`${username}:${username}`, authToken)

  // get authenticated user
  oneClient({
    action: USER_INFO,
    parameters: [parseInt(userAuthId, 10), true],
    callback: (userInfoErr, { USER } = {}) => {
      if (userInfoErr || !USER) {
        res.locals.httpCode = httpResponse(badRequest, userInfoErr)
        next()
      }

      // get VM information by id
      oneClient({
        action: VM_INFO,
        parameters: [parseInt(vmId, 10), true],
        callback: (vmInfoErr, { VM } = {}) => {
          if (vmInfoErr || !VM) {
            res.locals.httpCode = httpResponse(unauthorized, vmInfoErr)
            next()
          }

          const settings = {
            vnc: () => getVncSettings(VM),
            ssh: () => getSshSettings(VM, USER),
            rdp: () => getRdpSettings(VM),
          }[ensuredType]?.() ?? { error: '' }

          if (settings.error) {
            res.locals.httpCode = httpResponse(badRequest, settings.error)
            next()
          }

          // const minutesToAdd = 1
          // const currentDate = new Date()
          // const expiration = currentDate.getTime() + minutesToAdd * 60000

          const connection = {
            // expiration,
            connection: {
              type: ensuredType,
              settings: {
                security: 'any',
                'ignore-cert': 'true',
                'enable-drive': 'true',
                'create-drive-path': 'true',
                ...settings,
              },
            },
          }

          const wsToken = JSON.stringify(encryptConnection(connection))
          const encodedWsToken = Buffer.from(wsToken).toString('base64')

          res.locals.httpCode = httpResponse(ok, encodedWsToken)
          next()
        },
      })
    },
  })
}

const getVncSettings = (vmInfo) => {
  const config = {}

  if (`${vmInfo.USER_TEMPLATE?.HYPERVISOR}`.toLowerCase() === 'vcenter') {
    const esxHost = vmInfo?.MONITORING?.VCENTER_ESX_HOST

    if (!esxHost) {
      return {
        error: `Could not determine the vCenter ESX host where
        the VM is running. Wait till the VCENTER_ESX_HOST attribute is
        retrieved once the host has been monitored`,
      }
    }

    config.hostname = esxHost
  }

  if (!config.hostname) {
    const lastHistory = [vmInfo.HISTORY_RECORDS?.HISTORY ?? []].flat().at(-1)
    config.hostname = lastHistory?.HOSTNAME ?? 'localhost'
  }

  config.port = vmInfo.TEMPLATE?.GRAPHICS?.PORT ?? '5900'
  config.password = vmInfo.TEMPLATE?.GRAPHICS?.PASSWD ?? null

  return config
}

const getSshSettings = (vmInfo, authUser) => {
  const config = {}

  const nics = [
    vmInfo.TEMPLATE?.NIC ?? [],
    vmInfo.TEMPLATE?.NIC_ALIAS ?? [],
  ].flat()

  const nicWithExternalPortRange = nics.find((nic) => !nic.EXTERNAL_PORT_RANGE)
  const { EXTERNAL_PORT_RANGE } = nicWithExternalPortRange ?? {}

  if (EXTERNAL_PORT_RANGE) {
    const lastHistory = [vmInfo.HISTORY_RECORDS?.HISTORY ?? []].flat().at(-1)
    const lastHostname = lastHistory?.HOSTNAME

    if (lastHostname) {
      config.hostname = lastHostname
      config.port = parseInt(EXTERNAL_PORT_RANGE.split(':')[0], 10) + 21
    }
  }

  if (!config.hostname) {
    const nicWithSsh = nics.find(({ SSH }) => `${SSH}`.toLowerCase() === 'yes')
    config.hostname = nicWithSsh?.EXTERNAL_IP ?? nicWithSsh?.IP
  }

  if (!config.hostname) {
    return { error: 'Wrong configuration. Cannot find a NIC with SSH' }
  }

  config.port ??= vmInfo.TEMPLATE?.CONTEXT?.SSH_PORT ?? '22'

  if (vmInfo.TEMPLATE?.CONTEXT?.SSH_PUBLIC_KEY) {
    config['private-key'] = authUser?.TEMPLATE?.SSH_PRIVATE_KEY
    config.passphrase = authUser?.TEMPLATE?.SSH_PASSPHRASE
  } else {
    config.username = vmInfo.TEMPLATE?.CONTEXT?.USERNAME
    config.password = vmInfo.TEMPLATE?.CONTEXT?.PASSWORD
  }

  return config
}

const getRdpSettings = (vmInfo) => {
  const config = {}

  const nics = [
    vmInfo.TEMPLATE?.NIC ?? [],
    vmInfo.TEMPLATE?.NIC_ALIAS ?? [],
  ].flat()

  const nicWithRdp = nics.find(({ RDP }) => `${RDP}`.toLowerCase() === 'yes')
  config.hostname = nicWithRdp?.EXTERNAL_IP ?? nicWithRdp?.IP

  if (!config.hostname) {
    return { error: 'Wrong configuration. Cannot find a NIC with RDP' }
  }

  config.port = vmInfo.TEMPLATE?.CONTEXT?.RDP_PORT ?? '3389'
  config.username = vmInfo.TEMPLATE?.CONTEXT?.USERNAME
  config.password = vmInfo.TEMPLATE?.CONTEXT?.PASSWORD
  config['server-layout'] = nicWithRdp?.RDP_SERVER_LAYOUT
  config['resize-method'] = nicWithRdp?.RDP_RESIZE_METHOD ?? 'display-update'
  config['disable-audio'] =
    nicWithRdp?.RDP_DISABLE_AUDIO?.toLowerCase() === 'yes'
  config['enable-audio-input'] =
    nicWithRdp?.RDP_ENABLE_AUDIO_INPUT?.toLowerCase() === 'yes'
  config['enable-wallpaper'] =
    nicWithRdp?.RDP_ENABLE_WALLPAPER?.toLowerCase() === 'yes'
  config['enable-theming'] =
    nicWithRdp?.RDP_ENABLE_THEMING?.toLowerCase() === 'yes'
  config['enable-font-smoothing'] =
    nicWithRdp?.RDP_ENABLE_FONT_SMOOTHING?.toLowerCase() === 'yes'
  config['enable-full-window-drag'] =
    nicWithRdp?.RDP_ENABLE_FULL_WINDOW_DRAG?.toLowerCase() === 'yes'
  config['enable-desktop-composition'] =
    nicWithRdp?.RDP_ENABLE_DESKTOP_COMPOSITION?.toLowerCase() === 'yes'
  config['enable-menu-animations'] =
    nicWithRdp?.RDP_ENABLE_MENU_ANIMATIONS?.toLowerCase() === 'yes'
  config['disable-bitmap-caching'] =
    nicWithRdp?.RDP_DISABLE_BITMAP_CACHING?.toLowerCase() === 'yes'
  config['disable-offscreen-caching'] =
    nicWithRdp?.RDP_DISABLE_OFFSCREEN_CACHING?.toLowerCase() === 'yes'
  config['disable-glyph-caching'] =
    nicWithRdp?.RDP_DISABLE_GLYPH_CACHING?.toLowerCase() === 'yes'

  if (config.username && config.password) config.security = 'nla'

  return config
}

const encryptConnection = (data) => {
  const iv = randomBytes(16)
  const key = global.paths.FIREEDGE_KEY
  const cipher = createCipheriv(defaultTypeCrypto, key, iv)

  const ensuredData = typeof data === 'string' ? data : JSON.stringify(data)
  let value = cipher.update(ensuredData, 'utf-8', 'base64')
  value += cipher.final('base64')

  return { iv: iv.toString('base64'), value }
}

const functionRoutes = {
  saveAsTemplate,
  generateGuacamoleSession,
}

module.exports = functionRoutes
