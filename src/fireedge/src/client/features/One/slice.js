import { createSlice } from '@reduxjs/toolkit'

const initial = {
  requests: {},

  vms: [],
  templates: [],
  applications: [],
  applicationsTemplates: [],
  datastores: [],
  virtualRouters: [],
  vmGroups: [],
  images: [],
  files: [],
  marketplaces: [],
  apps: [],
  vNetworks: [],
  vNetworksTemplates: [],
  securityGroups: [],
  clusters: [],
  hosts: [],
  zones: [],
  users: [],
  groups: [],
  vdc: [],
  acl: [],
  provisionsTemplates: [],
  providers: [],
  provisions: []
}

const { actions, reducer } = createSlice({
  name: 'pool',
  initialState: initial,
  extraReducers: builder => {
    builder
      .addCase('logout', () => initial)
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
