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

export const getResourceFromEventState = socketData => {
  const { HOOK_OBJECT: name, [name]: value } = socketData?.data?.HOOK_MESSAGE ?? {}

  return { name: String(name).toLowerCase(), value }
}

export const getResourceFromEventApi = (eventApi = {}) => {
  const { CALL: command = '', CALL_INFO: info = {} } = eventApi?.HOOK_MESSAGE
  const { EXTRA: extra, RESULT: result, PARAMETERS } = info

  // command: 'one.resourceName.action'
  const [, resourceName, action] = command.split('.')

  // success: 1 || error: 0
  const success = result === '1'

  const value = extra?.[String(resourceName).toUpperCase()]

  const resource = RESOURCES[resourceName]
  const name = resource?.[value?.TYPE] ?? resource

  const [, { VALUE: output }] = PARAMETERS?.PARAMETER
    ?.filter(({ TYPE }) => TYPE === 'OUT')

  return {
    action,
    name,
    value,
    success,
    output
  }
}

export const socketEventApi = createAsyncThunk(
  'socket/event-api',
  ({ data }) => {
    const { action, name, value, success } = getResourceFromEventApi(data)

    // console.log({ action, name, value, success, output })

    return (success && value && action !== COMMANDS.delete) ? { [name]: value } : {}
  },
  {
    condition: payload => payload?.data?.HOOK_MESSAGE?.HOOK_TYPE === 'API'
  }
)

export const eventUpdateResourceState = createAsyncThunk(
  'socket/event-state',
  socketData => {
    const { name, value } = getResourceFromEventState(socketData)

    return { type: name, data: value }
  },
  {
    condition: socketData => {
      const { name, value } = getResourceFromEventState(socketData)

      return (
        socketData?.data?.HOOK_MESSAGE?.HOOK_TYPE === 'STATE' &&
        // possible hook objects: VM, IMAGE, HOST
        ['vm', 'host', 'image'].includes(name) &&
        // update the list if event returns resource value
        value !== ''
      )
    }
  }
)

export const socketCreateProvision = createAsyncThunk(
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
