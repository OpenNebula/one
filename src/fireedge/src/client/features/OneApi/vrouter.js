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
import { Actions, Commands } from 'server/utils/constants/commands/vrouter'
import {
  oneApi,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
} from 'client/features/OneApi'

import {
  updateNameOnResource,
  updatePermissionOnResource,
  updateOwnershipOnResource,
  updateTemplateOnResource,
} from 'client/features/OneApi/common'
import { Permission, FilterFlag } from 'client/constants'

const { VROUTER } = ONE_RESOURCES
const { VROUTER_POOL } = ONE_RESOURCES_POOL

const virtualRouterApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getVRouters: builder.query({
      /**
       * Retrieves information for all or part of the virtual routers in the pool.
       *
       * @param {object} params - Request params
       * @param {FilterFlag} [params.filter] - Filter flag
       * @param {number} [params.start] - Range start ID
       * @param {number} [params.end] - Range end ID
       * @returns {Array} List of virtual routers
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VROUTER_POOL_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => [data?.VROUTER_POOL?.VROUTER ?? []].flat(),
      providesTags: (vRouters) =>
        vRouters
          ? [
              ...vRouters.map(({ ID }) => ({ type: VROUTER_POOL, ID })),
              VROUTER_POOL,
            ]
          : [VROUTER_POOL],
    }),

    getVRouter: builder.query({
      /**
       * Retrieves information for the virtual router.
       *
       * @param {object} params - Request params
       * @param {string|number} params.id - Virtual router id
       * @param {boolean} [params.decrypt] - Optional flag to decrypt contained secrets, valid only for admin
       * @returns {object} Get virtual router identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VROUTER_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data?.VROUTER ?? {},
      providesTags: (_, __, { id }) => [{ type: VROUTER, id }],
    }),

    changeVRouterOwnership: builder.mutation({
      /**
       * Changes the ownership bits of a virtual router.
       * If set to `-1`, the user or group aren't changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual router id
       * @param {number} params.user - The user id
       * @param {number} params.group - The group id
       * @returns {number} Virtual router id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VROUTER_CHOWN
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VROUTER, id }],
      async onQueryStarted(params, { getState, dispatch, queryFulfilled }) {
        try {
          const patchVr = dispatch(
            virtualRouterApi.util.updateQueryData(
              'getVRouter',
              { id: params.id },
              updateOwnershipOnResource(getState(), params)
            )
          )

          queryFulfilled.catch(patchVr.undo)
        } catch {}
      },
    }),

    changeVRouterPermissions: builder.mutation({
      /**
       * Changes the permission bits of a virtual router.
       * If set any permission to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Virtual router id
       * @param {Permission|'-1'} params.ownerUse - User use
       * @param {Permission|'-1'} params.ownerManage - User manage
       * @param {Permission|'-1'} params.ownerAdmin - User administrator
       * @param {Permission|'-1'} params.groupUse - Group use
       * @param {Permission|'-1'} params.groupManage - Group manage
       * @param {Permission|'-1'} params.groupAdmin - Group administrator
       * @param {Permission|'-1'} params.otherUse - Other use
       * @param {Permission|'-1'} params.otherManage - Other manage
       * @param {Permission|'-1'} params.otherAdmin - Other administrator
       * @returns {number} Virtual router id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VROUTER_CHMOD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VROUTER, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVr = dispatch(
            virtualRouterApi.util.updateQueryData(
              'getVRouter',
              { id: params.id },
              updatePermissionOnResource(params)
            )
          )

          queryFulfilled.catch(patchVr.undo)
        } catch {}
      },
    }),

    renameVRouter: builder.mutation({
      /**
       * Renames a VM template.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VR id
       * @param {string} params.name - The new name
       * @returns {number} VR id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VROUTER_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VROUTER, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVR = dispatch(
            virtualRouterApi.util.updateQueryData(
              'getVRouter',
              { id: params.id },
              updateNameOnResource(params)
            )
          )

          const patchVRs = dispatch(
            virtualRouterApi.util.updateQueryData(
              'getVRouters',
              undefined,
              updateNameOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVR.undo()
            patchVRs.undo()
          })
        } catch {}
      },
    }),

    updateVRouter: builder.mutation({
      /**
       * Replaces the template contents in a vrouter.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - VRouter id
       * @param {string} params.template - The new template contents
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VROUTER_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VROUTER, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVRouter = dispatch(
            virtualRouterApi.util.updateQueryData(
              'getVRouter',
              { id: params.id },
              updateTemplateOnResource(params)
            )
          )

          const patchVRouters = dispatch(
            virtualRouterApi.util.updateQueryData(
              'getVRouters',
              undefined,
              updateTemplateOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVRouter.undo()
            patchVRouters.undo()
          })
        } catch {}
      },
    }),

    deleteVRouter: builder.mutation({
      query: (params) => {
        const name = Actions.VROUTER_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [VROUTER_POOL],
    }),
  }),
})

export const {
  // Queries
  useGetVRouterQuery,
  useLazyGetVRouterQuery,
  useGetVRoutersQuery,
  useLazyGetVRoutersQuery,
  useDeleteVRouterMutation,
  useChangeVRouterOwnershipMutation,
  useChangeVRouterPermissionsMutation,
  useRenameVRouterMutation,
  useUpdateVRouterMutation,
} = virtualRouterApi
