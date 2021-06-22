import { createSlice } from '@reduxjs/toolkit'

import { updateResourceList } from 'client/features/One/utils'
import { eventUpdateResourceState } from 'client/features/One/socket/actions'

const getNameListFromType = type => RESOURCES[type.split('/')[0]]

const ATTRIBUTES_EDITABLE = ['NAME', 'STATE', 'LCM_STATE']

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
    103: 'provisions',
    // extra: only for client
    defaults: 'provisionsTemplates'
  }
}

const initial = {
  requests: {},

  [RESOURCES.acl]: [],
  [RESOURCES.app]: [],
  [RESOURCES.cluster]: [],
  [RESOURCES.datastore]: [],
  [RESOURCES.file]: [],
  [RESOURCES.group]: [],
  [RESOURCES.host]: [],
  [RESOURCES.image]: [],
  [RESOURCES.marketplace]: [],
  [RESOURCES.secgroups]: [],
  [RESOURCES.template]: [],
  [RESOURCES.user]: [],
  [RESOURCES.vdc]: [],
  [RESOURCES.vm]: [],
  [RESOURCES.vmgroup]: [],
  [RESOURCES.vn]: [],
  [RESOURCES.vntemplate]: [],
  [RESOURCES.zone]: [],
  [RESOURCES.document[100]]: [],
  [RESOURCES.document[101]]: [],
  [RESOURCES.document[102]]: [],
  [RESOURCES.document[103]]: [],
  [RESOURCES.document.defaults]: []
}

const { actions, reducer } = createSlice({
  name: 'pool',
  initialState: initial,
  extraReducers: builder => {
    builder
      .addCase('logout', () => initial)
      .addMatcher(
        ({ type }) =>
          type.endsWith('/fulfilled') &&
          (type.includes(eventUpdateResourceState.typePrefix) || type.includes('/detail')),
        (state, { payload, type }) => {
          // TYPE and DATA can be force with the payload
          const name = getNameListFromType(payload?.type ?? type)
          const newList = updateResourceList(state[name], payload?.data ?? payload)

          return { ...state, [name]: newList }
        }
      )
      .addMatcher(
        ({ type }) => type.includes('/pool') && type.endsWith('/pending'),
        (state, { meta, type }) => {
          const pureType = type.replace('/pending', '')

          if (!state?.requests?.[pureType]) {
            state.requests[pureType] = meta
          }
        }
      )
      .addMatcher(
        ({ type }) => type.includes('/pool') && type.endsWith('/fulfilled'),
        (state, { payload, type }) => {
          const { [getNameListFromType(type)]: _, ...requests } = state.requests

          return { ...state, requests, ...payload }
        }
      )
  }
})

export { actions, reducer, RESOURCES, ATTRIBUTES_EDITABLE }
