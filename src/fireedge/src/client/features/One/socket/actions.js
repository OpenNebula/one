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
import { HookStateData, HookApiData } from 'client/features/One/socket/types'
import { generateKey } from 'client/utils'

const MESSAGE_PROVISION_SUCCESS_CREATED = 'Provision successfully created'

const COMMANDS = {
  create: 'create',
  update: 'update',
  delete: 'delete',
}

/**
 * @param {HookStateData} data - Event data from hook event STATE
 * @returns {{name: ('vm'|'host'|'image'), value: object}}
 * - Name and new value of resource
 */
export const getResourceFromEventState = (data) => {
  const { HOOK_OBJECT: name, [name]: value } = data?.HOOK_MESSAGE ?? {}

  return { name: String(name).toLowerCase(), value }
}

/**
 * @param {HookApiData} data - Event data from hook event API
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

  const [, { VALUE: output }] = PARAMETERS?.PARAMETER?.filter(
    ({ TYPE }) => TYPE === 'OUT'
  )

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

    return success && value && action !== COMMANDS.delete
      ? { [name]: value }
      : {}
  },
  {
    condition: ({ data } = {}) => data?.HOOK_MESSAGE?.HOOK_TYPE === 'API',
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
    },
  }
)

/**
 * Dispatch successfully notification when one provision is created
 */
export const onCreateProvision = createAsyncThunk(
  'socket/create-provision',
  (_, { dispatch }) => {
    dispatch(
      actions.enqueueSnackbar({
        key: generateKey(),
        message: MESSAGE_PROVISION_SUCCESS_CREATED,
        options: { variant: 'success' },
      })
    )
  },
  {
    condition: (payload = {}) => {
      const { command, data } = payload

      return command === 'create' && data === MESSAGE_PROVISION_SUCCESS_CREATED
    },
  }
)
