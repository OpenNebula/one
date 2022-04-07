/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
  Actions as SunstoneActions,
  Commands as SunstoneCommands,
} from 'server/routes/api/sunstone/routes'
import { actions } from 'client/features/Auth/slice'
import { oneApi, ONE_RESOURCES } from 'client/features/OneApi'

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
    getSunstoneConfig: builder.query({
      /**
       * Returns the Sunstone configuration.
       *
       * @returns {object} The loaded sunstone-server.conf file
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
          const { data: views = {} } = await queryFulfilled

          const currentView = getState().auth?.view
          !currentView && dispatch(actions.changeView(Object.keys(views)[0]))
        } catch {}
      },
      providesTags: [{ type: SYSTEM, id: 'sunstone-views' }],
      keepUnusedDataFor: 600,
    }),
  }),
})

export const {
  // Queries
  useGetOneVersionQuery,
  useLazyGetOneVersionQuery,
  useGetOneConfigQuery,
  useLazyGetOneConfigQuery,
  useGetSunstoneConfigQuery,
  useLazyGetSunstoneConfigQuery,
  useGetSunstoneViewsQuery,
  useLazyGetSunstoneViewsQuery,
} = systemApi

export default systemApi
