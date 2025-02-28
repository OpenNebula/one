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
import { Actions, Commands } from 'server/utils/constants/commands/system'
import {
  Actions as SystemActions,
  Commands as SystemCommands,
} from 'server/routes/api/system/routes'
import {
  Actions as SunstoneActions,
  Commands as SunstoneCommands,
} from 'server/routes/api/sunstone/routes'
import { AuthSlice } from '@modules/features/Auth/slice'
import { oneApi } from '@modules/features/OneApi/oneApi'
import { ONE_RESOURCES } from '@modules/features/OneApi/resources'
const { actions } = AuthSlice

const { SYSTEM } = ONE_RESOURCES

const systemApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getOneVersion: builder.query({
      /**
       * Returns the OpenNebula core version.
       *
       * @returns {object} The OpenNebula version
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.SYSTEM_VERSION
        const command = { name, ...Commands[name] }

        return { command }
      },
      providesTags: [{ type: SYSTEM, id: 'version' }],
      keepUnusedDataFor: 600,
    }),
    getOneConfig: builder.query({
      /**
       * Returns the OpenNebula configuration.
       *
       * @returns {object} The loaded oned.conf file
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.SYSTEM_CONFIG
        const command = { name, ...Commands[name] }

        return { command }
      },
      providesTags: [{ type: SYSTEM, id: 'config' }],
      keepUnusedDataFor: 600,
    }),
    getTabManifest: builder.query({
      /**
       * Returns the Tab Manifest configuration.
       *
       * @returns {object} The loaded tab-manifest.json file
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = SystemActions.TAB_CONFIG
        const command = { name, ...SystemCommands[name] }

        return { command }
      },
      providesTags: [{ type: SYSTEM, id: 'tab-config' }],
      keepUnusedDataFor: 600,
    }),
    getSunstoneViews: builder.query({
      /**
       * Returns the Sunstone configuration for resource tabs.
       *
       * @returns {object} The loaded sunstone view files
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = SunstoneActions.SUNSTONE_VIEWS
        const command = { name, ...SunstoneCommands[name] }

        return { command }
      },
      async onQueryStarted(_, { dispatch, getState, queryFulfilled }) {
        try {
          const { data: { defaultView, views = {} } = {} } =
            await queryFulfilled

          const currentView = getState().auth?.view

          // Set to default view if exists
          !currentView &&
            dispatch(actions.changeView(defaultView || Object.keys(views)[0]))
        } catch {}
      },
      providesTags: [{ type: SYSTEM, id: 'sunstone-views' }],
      keepUnusedDataFor: 600,
    }),
    getSunstoneConfig: builder.query({
      /**
       * Returns the Sunstone configuration for resource tabs.
       *
       * @returns {object} The loaded sunstone view files
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = SunstoneActions.SUNSTONE_CONFIG
        const command = { name, ...SunstoneCommands[name] }

        return { command }
      },
      providesTags: [{ type: SYSTEM, id: 'sunstone-config' }],
      keepUnusedDataFor: 600,
    }),
    getSunstoneAvailableViews: builder.query({
      /**
       * Returns the Sunstone avalaible views.
       *
       * @returns {object} The avalaible views
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = SunstoneActions.SUNSTONE_AVAILABLE_VIEWS
        const command = { name, ...SunstoneCommands[name] }

        return { command }
      },
      providesTags: [{ type: SYSTEM, id: 'sunstone-avalaibles-views' }],
      keepUnusedDataFor: 600,
    }),

    getOsProfiles: builder.query({
      /**
       * Returns the OS Profiles or a specific profile's content.
       *
       * @param {object} params - Request params
       * @returns {object} The set config options
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = SystemActions.PROFILES
        const command = { name, ...SystemCommands[name] }

        return { params, command }
      },
      providesTags: (response) => {
        if (Array.isArray(response) && response?.length > 0) {
          return response?.map((profile) => ({ type: SYSTEM, id: profile }))
        } else {
          return [{ type: SYSTEM, id: 'os_profile' }]
        }
      },
      keepUnusedDataFor: 600,
    }),

    getVmmConfig: builder.query({
      /**
       * Returns the hypervisor VMM_EXEC config.
       *
       * @param {object} params - Request params
       * @returns {object} The set config options
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = SystemActions.VMM_CONFIG
        const command = { name, ...SystemCommands[name] }

        return { params, command }
      },
      providesTags: [{ type: SYSTEM, id: 'vmm_config' }],
      keepUnusedDataFor: 600,
    }),
  }),
})

const systemQueries = (({
  useGetOneVersionQuery,
  useLazyGetOneVersionQuery,
  useGetTabManifestQuery,
  useLazyGetTabManifestQuery,
  useGetOneConfigQuery,
  useLazyGetOneConfigQuery,
  useGetVmmConfigQuery,
  useLazyGetVmmConfigQuery,
  useGetOsProfilesQuery,
  useLazyGetOsProfilesQuery,
  useGetSunstoneConfigQuery,
  useLazyGetSunstoneConfigQuery,
  useGetSunstoneViewsQuery,
  useLazyGetSunstoneViewsQuery,
  useGetSunstoneAvailableViewsQuery,
}) => ({
  useGetOneVersionQuery,
  useLazyGetOneVersionQuery,
  useGetTabManifestQuery,
  useGetOsProfilesQuery,
  useLazyGetOsProfilesQuery,
  useLazyGetTabManifestQuery,
  useGetOneConfigQuery,
  useLazyGetOneConfigQuery,
  useGetVmmConfigQuery,
  useLazyGetVmmConfigQuery,
  useGetSunstoneConfigQuery,
  useLazyGetSunstoneConfigQuery,
  useGetSunstoneViewsQuery,
  useLazyGetSunstoneViewsQuery,
  useGetSunstoneAvailableViewsQuery,
}))(systemApi)

export default systemQueries
