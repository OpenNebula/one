/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { Zone } from 'client/constants'
import {
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
  oneApi,
} from 'client/features/OneApi'
import {
  removeResourceOnPool,
  updateNameOnResource,
  updateResourceOnPool,
  updateTemplateOnResource,
} from 'client/features/OneApi/common'
import { Actions, Commands } from 'server/utils/constants/commands/zone'

const { ZONE } = ONE_RESOURCES
const { ZONE_POOL } = ONE_RESOURCES_POOL

const zoneApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getZones: builder.query({
      /**
       * Retrieves information for all the zones in the pool.
       *
       * @returns {Zone[]} List of zones
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.ZONE_POOL_INFO
        const command = { name, ...Commands[name] }

        return { command }
      },
      transformResponse: (data) => [data?.ZONE_POOL?.ZONE ?? []].flat(),
      providesTags: (zones) =>
        zones
          ? [
              ...zones.map(({ ID }) => ({ type: ZONE_POOL, id: `${ID}` })),
              ZONE_POOL,
            ]
          : [ZONE_POOL],
    }),
    getZone: builder.query({
      /**
       * Retrieves information for the zone.
       *
       * @param {string} id - Zone id
       * @returns {Zone} Get zone identified by id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.ZONE_INFO
        const command = { name, ...Commands[name] }

        return { params: { id }, command }
      },
      transformResponse: (data) => data?.ZONE ?? {},
      providesTags: (_, __, { id }) => [{ type: ZONE, id }],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: resourceFromQuery } = await queryFulfilled

          dispatch(
            zoneApi.util.updateQueryData(
              'getZones',
              undefined,
              updateResourceOnPool({ id, resourceFromQuery })
            )
          )
        } catch {
          // if the query fails, we want to remove the resource from the pool
          dispatch(
            zoneApi.util.updateQueryData(
              'getZones',
              undefined,
              removeResourceOnPool({ id })
            )
          )
        }
      },
    }),
    getRaftStatus: builder.query({
      /**
       * Retrieves raft status one servers.
       *
       * @returns {string} The information string
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.ZONE_RAFTSTATUS
        const command = { name, ...Commands[name] }

        return { command }
      },
    }),
    allocateZone: builder.mutation({
      /**
       * Allocates a new zone in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.template - The string containing the template of the zone on syntax XML
       * @returns {number} The allocated zone id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.ZONE_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [ZONE],
    }),
    removeZone: builder.mutation({
      /**
       * Deletes the given zone from the pool.
       *
       * @param {number|string} id - Zone id
       * @returns {number} Zone id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.ZONE_DELETE
        const command = { name, ...Commands[name] }

        return { params: { id }, command }
      },
      invalidatesTags: [ZONE_POOL],
    }),
    updateZone: builder.mutation({
      /**
       * Replaces the zone template contents.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - Zone id
       * @param {string} params.template - The new template contents
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} Zone id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.ZONE_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: ZONE, id }, ZONE_POOL],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchZone = dispatch(
            zoneApi.util.updateQueryData(
              'getZone',
              { id: params.id },
              updateTemplateOnResource(params)
            )
          )

          const patchZones = dispatch(
            zoneApi.util.updateQueryData(
              'getZones',
              undefined,
              updateTemplateOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchZone.undo()
            patchZones.undo()
          })
        } catch {}
      },
    }),
    renameZone: builder.mutation({
      /**
       * Renames a zone.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Zone id
       * @param {string} params.name - The new name
       * @returns {number} Zone id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.ZONE_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: ZONE, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchZone = dispatch(
            zoneApi.util.updateQueryData(
              'getZone',
              { id: params.id },
              updateNameOnResource(params)
            )
          )

          const patchZones = dispatch(
            zoneApi.util.updateQueryData(
              'getZones',
              undefined,
              updateNameOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchZone.undo()
            patchZones.undo()
          })
        } catch {}
      },
    }),
  }),
})

export const {
  // Queries
  useGetZonesQuery,
  useLazyGetZonesQuery,
  useGetZoneQuery,
  useLazyGetZoneQuery,
  useGetRaftStatusQuery,
  useLazyGetRaftStatusQuery,

  // Mutations
  useAllocateZoneMutation,
  useRemoveZoneMutation,
  useUpdateZoneMutation,
  useRenameZoneMutation,
} = zoneApi

export default zoneApi
