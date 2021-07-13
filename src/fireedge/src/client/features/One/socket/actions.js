/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { createAsyncThunk } from '@reduxjs/toolkit'

import * as actions from 'client/features/General/actions'
import { RESOURCES } from 'client/features/One/slice'
import { generateKey } from 'client/utils'

const MESSAGE_PROVISION_SUCCESS_CREATED = 'Provision successfully created'

const COMMANDS = {
  create: 'create',
  update: 'update',
  delete: 'delete'
}

/**
 * @param {object} data
 * - Event data from socket
 * @param {object} data.HOOK_MESSAGE
 * - Hook message from OpenNebula API
 * @param {'STATE'} data.HOOK_MESSAGE.HOOK_TYPE
 * - Type of event API
 * @param {('VM'|'HOST'|'IMAGE')} data.HOOK_MESSAGE.HOOK_OBJECT
 * - Type name of the resource
 * @param {string} data.HOOK_MESSAGE.STATE
 * - The state that triggers the hook.
 * @param {string} [data.HOOK_MESSAGE.LCM_STATE]
 * - The LCM state that triggers the hook (Only for VM hooks)
 * @param {string} [data.HOOK_MESSAGE.REMOTE_HOST]
 * - If ``yes`` the hook will be executed in the host that triggered
 * the hook (for Host hooks) or in the host where the VM is running (for VM hooks).
 * Not used for Image hooks.
 * @param {string} data.HOOK_MESSAGE.RESOURCE_ID
 * - ID of resource
 * @param {object} [data.HOOK_MESSAGE.VM]
 * - New data of the VM
 * @param {object} [data.HOOK_MESSAGE.HOST]
 * - New data of the HOST
 * @param {object} [data.HOOK_MESSAGE.IMAGE]
 * - New data of the IMAGE
 * @returns {{name: ('vm'|'host'|'image'), value: object}}
 * - Name and new value of resource
 */
export const getResourceFromEventState = data => {
  const { HOOK_OBJECT: name, [name]: value } = data?.HOOK_MESSAGE ?? {}

  return { name: String(name).toLowerCase(), value }
}

/**
 * API call parameter.
 *
 * @typedef {object} Parameter
 * @property {number} POSITION - Parameter position in the list
 * @property {('IN'|'OUT')} TYPE - Parameter type
 * @property {string} VALUE - Parameter value as string
 */

/**
 * @param {object} data
 * - Event data from socket
 * @param {object} data.HOOK_MESSAGE
 * - Hook message from OpenNebula API
 * @param {'API'} data.HOOK_MESSAGE.HOOK_TYPE
 * - Type of event API
 * @param {string} data.HOOK_MESSAGE.CALL
 * - Action name: 'one.resourceName.action'
 * @param {object} [data.HOOK_MESSAGE.CALL_INFO]
 * - Information about result of action
 * @param {(0|1)} data.HOOK_MESSAGE.CALL_INFO.RESULT
 * - `1` for success and `0` for error result
 * @param {Parameter[]|Parameter} [data.HOOK_MESSAGE.CALL_INFO.PARAMETERS]
 * - The list of IN and OUT parameters will match the API call parameters
 * @param {object} [data.HOOK_MESSAGE.CALL_INFO.EXTRA]
 * - Extra information returned for API Hooks
 * @returns {{
 * action: string,
 * name: string,
 * value: object,
 * success: boolean,
 * output: object
 * }} - Resource information from event Api
 */
export const getResourceFromEventApi = (data = {}) => {
  const { CALL: command = '', CALL_INFO: info = {} } = data?.HOOK_MESSAGE
  const { EXTRA: extra, RESULT: result, PARAMETERS } = info

  // command: 'one.resourceName.action'
  const [, resourceName, action] = command.split('.')

  const success = result === '1'

  const value = extra?.[String(resourceName).toUpperCase()]

  const resource = RESOURCES[resourceName]
  const name = resource?.[value?.TYPE] ?? resource

  const [, { VALUE: output }] = PARAMETERS?.PARAMETER
    ?.filter(({ TYPE }) => TYPE === 'OUT')

  return { action, name, value, success, output }
}

/**
 * The API hooks are triggered after the execution of an API call.
 */
export const eventApi = createAsyncThunk(
  'socket/event-api',
  ({ data } = {}) => {
    const { action, name, value, success } = getResourceFromEventApi(data)

    // console.log({ action, name, value, success, output })

    return (success && value && action !== COMMANDS.delete) ? { [name]: value } : {}
  },
  {
    condition: ({ data } = {}) => data?.HOOK_MESSAGE?.HOOK_TYPE === 'API'
  }
)

/**
 * Dispatch new resource object when OpenNebula hooks is triggered
 * on specific state transition.
 *
 * Supported values: `HOST`, `VM`, `IMAGE`
 */
export const eventUpdateResourceState = createAsyncThunk(
  'socket/event-state',
  (data = {}) => {
    const { name, value } = getResourceFromEventState(data)

    return { type: name, data: value }
  },
  {
    condition: (data = {}) => {
      const { name, value } = getResourceFromEventState(data)

      return (
        data?.HOOK_MESSAGE?.HOOK_TYPE === 'STATE' &&
        // possible hook objects: VM, IMAGE, HOST
        ['vm', 'host', 'image'].includes(name) &&
        // update the list if event returns resource value
        value !== ''
      )
    }
  }
)

/**
 * Dispatch successfully notification when one provision is created
 */
export const onCreateProvision = createAsyncThunk(
  'socket/create-provision',
  (_, { dispatch }) => {
    dispatch(actions.enqueueSnackbar({
      key: generateKey(),
      message: MESSAGE_PROVISION_SUCCESS_CREATED,
      options: { variant: 'success' }
    }))
  },
  {
    condition: (payload = {}) => {
      const { command, data } = payload

      return (
        command === 'create' &&
        data === MESSAGE_PROVISION_SUCCESS_CREATED
      )
    }
  }
)
