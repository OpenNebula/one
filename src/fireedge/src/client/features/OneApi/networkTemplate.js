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
import { FilterFlag, Permission, VNetworkTemplate } from 'client/constants'
import {
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
  oneApi,
} from 'client/features/OneApi'
import {
  updateOwnershipOnResource,
  updateTemplateOnResource,
} from 'client/features/OneApi/common'
import { Actions, Commands } from 'server/utils/constants/commands/vntemplate'

const { VNTEMPLATE } = ONE_RESOURCES
const { VNET_POOL, VNTEMPLATE_POOL } = ONE_RESOURCES_POOL

const vNetworkTemplateApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getVNTemplates: builder.query({
      /**
       * Retrieves information for all or part of the VN template in the pool.
       *
       * @param {object} params - Request params
       * @param {FilterFlag} [params.filter] - Filter flag
       * @param {number} [params.start] - Range start ID
       * @param {number} [params.end] - Range end ID
       * @returns {VNetworkTemplate[]} List of virtual network templates
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VNTEMPLATE_POOL_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) =>
        [data?.VNTEMPLATE_POOL?.VNTEMPLATE ?? []].flat(),
      providesTags: (vNetTemplates) =>
        vNetTemplates
          ? [
              ...vNetTemplates.map(({ ID }) => ({
                type: VNTEMPLATE_POOL,
                id: `${ID}`,
              })),
              VNTEMPLATE_POOL,
            ]
          : [VNTEMPLATE_POOL],
    }),
    getVNTemplate: builder.query({
      /**
       * Retrieves information for the virtual network template.
       *
       * @param {object} params - Request params
       * @param {string|number} params.id - Virtual network template id
       * @param {boolean} [params.decrypt] - Optional flag to decrypt contained secrets, valid only for admin
       * @returns {VNetworkTemplate} Get virtual network template identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VNTEMPLATE_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data?.VNTEMPLATE ?? {},
      providesTags: (_, __, { id }) => [{ type: VNTEMPLATE, id }],
    }),
    allocateVNTemplate: builder.mutation({
      /**
       * Allocates a new VN Template in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.template - A string containing the template of the VN Template on syntax XML
       * @returns {number} VN Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VNTEMPLATE_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [VNTEMPLATE_POOL],
    }),
    cloneVNTemplate: builder.mutation({
      /**
       * Clones an existing VN template.
       *
       * @param {object} params - Request params
       * @param {string} params.id - The ID of the VN template to be cloned
       * @param {string} params.name - Name for the new resource
       * @returns {number} VN Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VNTEMPLATE_CLONE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [VNTEMPLATE_POOL],
    }),
    removeVNTemplate: builder.mutation({
      /**
       * Deletes the given VN template from the pool.
       *
       * @param {object} params - Request params
       * @param {string} params.id - The ID of the VN template
       * @returns {number} VN Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VNTEMPLATE_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [VNTEMPLATE_POOL],
    }),
    instantiateVNTemplate: builder.mutation({
      /**
       * Instantiates a new Virtual Network from a VN template.
       *
       * @param {object} params - Request params
       * @param {string} params.id - The object id
       * @param {string} [params.name] - Name for the new Virtual Network
       * @param {string} [params.template]
       * - A string containing an extra VN template
       * to be merged with the one being instantiated on syntax XML
       * @returns {number} The new Virtual Network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VNTEMPLATE_INSTANTIATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [VNET_POOL],
    }),
    updateVNTemplate: builder.mutation({
      /**
       * Replaces the VN Template template contents.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - VN Template id
       * @param {string} params.template - The new template contents
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} VN Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VNTEMPLATE_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNTEMPLATE, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchVNTemplate = dispatch(
            vNetworkTemplateApi.util.updateQueryData(
              'getVNTemplate',
              { id: params.id },
              updateTemplateOnResource(params)
            )
          )

          const patchVNTemplates = dispatch(
            vNetworkTemplateApi.util.updateQueryData(
              'getVNTemplates',
              undefined,
              updateTemplateOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchVNTemplate.undo()
            patchVNTemplates.undo()
          })
        } catch {}
      },
    }),
    changeVNTemplatePermissions: builder.mutation({
      /**
       * Changes the permission bits of a VN Template.
       * If set any permission to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VN Template id
       * @param {Permission|'-1'} params.ownerUse - User use
       * @param {Permission|'-1'} params.ownerManage - User manage
       * @param {Permission|'-1'} params.ownerAdmin - User administrator
       * @param {Permission|'-1'} params.groupUse - Group use
       * @param {Permission|'-1'} params.groupManage - Group manage
       * @param {Permission|'-1'} params.groupAdmin - Group administrator
       * @param {Permission|'-1'} params.otherUse - Other use
       * @param {Permission|'-1'} params.otherManage - Other manage
       * @param {Permission|'-1'} params.otherAdmin - Other administrator
       * @returns {number} VN Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VNTEMPLATE_CHMOD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNTEMPLATE, id }],
    }),
    changeVNTemplateOwnership: builder.mutation({
      /**
       * Changes the ownership of a VN Template.
       * If set `user` or `group` to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VN Template id
       * @param {string|number|'-1'} [params.userId] - User id
       * @param {Permission|'-1'} [params.groupId] - Group id
       * @returns {number} VN Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VNTEMPLATE_CHOWN
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: VNTEMPLATE, id }],
      async onQueryStarted(params, { getState, dispatch, queryFulfilled }) {
        try {
          const patchVNet = dispatch(
            vNetworkTemplateApi.util.updateQueryData(
              'getVNTemplate',
              { id: params.id },
              updateOwnershipOnResource(getState(), params)
            )
          )

          queryFulfilled.catch(patchVNet.undo)
        } catch {}
      },
    }),
    renameVNTemplate: builder.mutation({
      /**
       * Renames a VN Template.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - VN Template id
       * @param {string} params.name - The new name
       * @returns {number} VN Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VNTEMPLATE_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VNTEMPLATE, id },
        VNTEMPLATE_POOL,
      ],
    }),
    lockVNTemplate: builder.mutation({
      /**
       * Locks a VN Template. Lock certain actions depending on blocking level.
       * - `USE` (1): locks Admin, Manage and Use actions.
       * - `MANAGE` (2): locks Manage and Use actions.
       * - `ADMIN` (3): locks only Admin actions.
       * - `ALL` (4): locks all actions.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - VN Template id
       * @param {'1'|'2'|'3'|'4'} params.lock - Lock level
       * @returns {number} VN Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VNTEMPLATE_LOCK
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VNTEMPLATE, id },
        VNTEMPLATE_POOL,
      ],
    }),
    unlockVNTemplate: builder.mutation({
      /**
       * Unlocks a VN Template.
       *
       * @param {object} params - Request parameters
       * @returns {number} VN Template id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VNTEMPLATE_UNLOCK
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: VNTEMPLATE, id },
        VNTEMPLATE_POOL,
      ],
    }),
  }),
})

export const {
  // Queries
  useGetVNTemplateQuery,
  useLazyGetVNTemplateQuery,
  useGetVNTemplatesQuery,
  useLazyGetVNTemplatesQuery,

  // Mutations
  useAllocateVNTemplateMutation,
  useCloneVNTemplateMutation,
  useRemoveVNTemplateMutation,
  useInstantiateVNTemplateMutation,
  useUpdateVNTemplateMutation,
  useChangeVNTemplatePermissionsMutation,
  useChangeVNTemplateOwnershipMutation,
  useRenameVNTemplateMutation,
  useLockVNTemplateMutation,
  useUnlockVNTemplateMutation,
} = vNetworkTemplateApi

export default vNetworkTemplateApi
