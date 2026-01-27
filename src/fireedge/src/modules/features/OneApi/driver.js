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
import { Actions, Commands } from 'server/routes/api/oneform/driver/routes'

import { oneApi } from '@modules/features/OneApi/oneApi'
import { FORM, FORM_POOL } from '@modules/features/OneApi/resources'
import { Driver } from '@ConstantsModule'

const { DRIVER } = FORM
const { DRIVER_POOL } = FORM_POOL

const driverApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getDrivers: builder.query({
      /**
       * Retrieves information for all drivers.
       *
       * @returns {Driver[]} List of drivers
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.LIST
        const command = { name, ...Commands[name] }

        return { command }
      },
      transformResponse: (data) =>
        data.map((driver) => ({
          ...driver,
          name: driver.name.toLowerCase(),
        })),
      providesTags: (drivers) =>
        drivers
          ? [
              ...drivers.map(({ ID }) => ({
                type: DRIVER_POOL,
                id: `${ID}`,
              })),
              DRIVER_POOL,
            ]
          : [DRIVER_POOL],
    }),

    getDriver: builder.query({
      /**
       * Retrieves information of a single driver.
       *
       * @param {object} params - Request params
       * @param {string} params.name - Driver name
       * @returns {Driver} Driver object
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.SHOW
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => ({ ...data, name: data.name.toLowerCase() }),
      providesTags: (_, __, { name }) => [
        { type: DRIVER, id: name.toLowerCase() },
      ],
    }),

    enableDriver: builder.mutation({
      /**
       * Enables a driver.
       *
       * @param {object} params - Request params
       * @param {string} params.name - Driver name
       * @returns {Driver} Updated driver
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.ENABLE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, id) => [{ type: DRIVER, id }, DRIVER_POOL],
    }),

    disableDriver: builder.mutation({
      /**
       * Disables a driver.
       *
       * @param {object} params - Request params
       * @param {string} params.name - Driver name
       * @returns {Driver} Updated driver
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.DISABLE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, id) => [{ type: DRIVER, id }, DRIVER_POOL],
    }),

    syncDrivers: builder.mutation({
      /**
       * Synchronizes all drivers.
       *
       * @returns {object} Sync result
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.SYNC
        const command = { name, ...Commands[name] }

        return { command }
      },
      invalidatesTags: [DRIVER_POOL],
    }),
  }),
})

export const driverQueries = (({
  // Queries
  useGetDriversQuery,
  useLazyGetDriversQuery,
  useGetDriverQuery,
  useLazyGetDriverQuery,

  // Mutations
  useEnableDriverMutation,
  useDisableDriverMutation,
  useSyncDriversMutation,
}) => ({
  // Queries
  useGetDriversQuery,
  useLazyGetDriversQuery,
  useGetDriverQuery,
  useLazyGetDriverQuery,

  // Mutations
  useEnableDriverMutation,
  useDisableDriverMutation,
  useSyncDriversMutation,
}))(driverApi)

export default driverQueries
