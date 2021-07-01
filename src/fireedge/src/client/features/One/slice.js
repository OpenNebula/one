import { createSlice, isPending, isFulfilled } from '@reduxjs/toolkit'

import { logout } from 'client/features/Auth/actions'
import { updateResourceList } from 'client/features/One/utils'
import { eventUpdateResourceState } from 'client/features/One/socket/actions'
import { updateResourceFromFetch } from 'client/features/One/actions'

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
  vrouter: 'vRouters',
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
  [RESOURCES.vrouter]: [],
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
      .addMatcher(({ type }) => type === logout.type, () => initial)
      .addMatcher(
        ({ type }) =>
          type === updateResourceFromFetch.type ||
          (
            type.endsWith('/fulfilled') &&
            (type.includes(eventUpdateResourceState.typePrefix) || type.includes('/detail'))
          ),
        (state, { payload, type }) => {
          // TYPE and DATA can be force by payload
          const name = getNameListFromType(payload?.type ?? type)
          const newList = updateResourceList(state[name], payload?.data ?? payload)

          return { ...state, [name]: newList }
        }
      )
      .addMatcher(
        ({ type }) => type.includes('/pool'),
        (state, action) => {
          const { requests } = state
          const { payload, type } = action

          // filter type without: /pending, /fulfilled or /rejected
          const pureType = type.match(/(.*\/pool)/)[0]

          if (isPending(action)) {
            return { ...state, requests: { ...requests, [pureType]: action } }
          }

          const { [pureType]: _, ...restOfRequests } = requests

          return {
            ...state,
            ...(isFulfilled(action) && payload),
            requests: restOfRequests
          }
        }
      )
  }
})

export { actions, reducer, RESOURCES, ATTRIBUTES_EDITABLE }
