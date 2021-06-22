import { createSlice } from '@reduxjs/toolkit'

import { socketEventState } from 'client/features/One/socket/actions'

const initial = {
  requests: {},

  acl: [],
  applications: [],
  applicationsTemplates: [],
  apps: [],
  clusters: [],
  datastores: [],
  files: [],
  groups: [],
  hosts: [],
  images: [],
  marketplaces: [],
  providers: [],
  provisions: [],
  provisionsTemplates: [],
  securityGroups: [],
  templates: [],
  users: [],
  vdc: [],
  virtualRouters: [],
  vmGroups: [],
  vms: [],
  vNetworks: [],
  vNetworksTemplates: [],
  zones: []
}

const { actions, reducer } = createSlice({
  name: 'pool',
  initialState: initial,
  extraReducers: builder => {
    builder
      .addCase('logout', () => initial)
      .addCase(
        socketEventState.fulfilled,
        (state, { payload }) => ({ ...state, ...payload })
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
          const { [type.replace('/fulfilled', '')]: _, ...requests } = state.requests

          return { ...state, requests, ...payload }
        }
      )
  }
})

export { actions, reducer }
