import { createAsyncThunk } from '@reduxjs/toolkit'

import * as actions from 'client/features/General/actions'
import { generateKey } from 'client/utils'

const MESSAGE_PROVISION_SUCCESS_CREATED = 'Provision successfully created'

const COMMANDS = {
  create: 'create',
  update: 'update',
  delete: 'delete'
}

const RESOURCES = {
  acl: 'acl',
  app: 'apps',
  cluster: 'clusters',
  datastore: 'datastores',
  file: 'files',
  group: 'groups',
  host: 'hosts',
  image: 'images',
  marketplace: 'marketplaces',
  secgroups: 'securityGroups',
  template: 'templates',
  user: 'users',
  vdc: 'vdc',
  vm: 'vms',
  vmgroup: 'vmGroups',
  vn: 'vNetworks',
  vntemplate: 'vNetworksTemplates',
  zone: 'zones',
  document: {
    100: 'applications',
    101: 'applicationsTemplates',
    102: 'providers',
    103: 'provisions'
  }
}

const getResourceFromEventApi = (eventApi = {}) => {
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
    const { action, name, value, success, output } = getResourceFromEventApi(data)

    // console.log({ action, name, value, success, output })

    return (success && value && action !== COMMANDS.delete) ? { [name]: value } : {}
  },
  {
    condition: payload => payload?.data?.HOOK_MESSAGE?.HOOK_TYPE === 'API'
  }
)

export const socketEventState = createAsyncThunk(
  'socket/event-state',
  ({ data }, { getState }) => {
    // possible hook objects: VM, IMAGE, HOST
    const { RESOURCE_ID, HOOK_OBJECT: name, [name]: value } = data?.HOOK_MESSAGE

    // update the list if event returns resource value
    if (!value || value === '') return

    const { NAME, STATE, LCM_STATE } = value

    // this won't be a document resource never
    const resource = RESOURCES[String(name).toLowerCase()]

    const currentList = getState()?.one?.[resource] ?? []

    const exists = currentList.some(({ ID }) => ID === RESOURCE_ID)

    // update if exists in current list, if not add it
    const updatedList = exists
      ? currentList?.map(item => ({
        ...item,
        ...(item?.ID === RESOURCE_ID && {
          NAME,
          STATE,
          ...(item?.LCM_STATE && { LCM_STATE })
        })
      }))
      : [value, ...currentList]

    return { [resource]: updatedList }
  },
  {
    condition: payload => payload?.data?.HOOK_MESSAGE?.HOOK_TYPE === 'STATE'
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
