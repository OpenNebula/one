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
import { Datastore, Permission } from 'client/constants'
import {
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
  oneApi,
} from 'client/features/OneApi'
import {
  removeResourceOnPool,
  updateNameOnResource,
  updateOwnershipOnResource,
  updatePermissionOnResource,
  updateResourceOnPool,
  updateTemplateOnResource,
} from 'client/features/OneApi/common'
import { Actions, Commands } from 'server/utils/constants/commands/datastore'

const { DATASTORE } = ONE_RESOURCES
const { DATASTORE_POOL } = ONE_RESOURCES_POOL

const datastoreApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getDatastores: builder.query({
      query: (params) => {
        const name = Actions.DATASTORE_POOL_INFO
        const command = { name, ...Commands[name] }

        return { command, params }
      },
      transformResponse: (data) =>
        [data?.DATASTORE_POOL?.DATASTORE ?? []].flat(),
      providesTags: (datastores) => {
        const tags = datastores
          ? [
              ...datastores.map(({ ID }) => ({
                type: DATASTORE_POOL,
                id: `${ID}`,
              })),
              DATASTORE_POOL,
            ]
          : [DATASTORE_POOL]

        return tags
      },
    }),
    getDatastore: builder.query({
      /**
       * Retrieves information for the datastore.
       *
       * @param {object} params - Request params
       * @param {string|number} params.id - Datastore id
       * @param {boolean} [params.decrypt] - Optional flag to decrypt contained secrets, valid only for admin
       * @returns {Datastore} Get datastore identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.DATASTORE_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data?.DATASTORE ?? {},
      providesTags: (_, __, { id }) => [{ type: DATASTORE, id }],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: resourceFromQuery } = await queryFulfilled

          dispatch(
            datastoreApi.util.updateQueryData(
              'getDatastores',
              undefined,
              updateResourceOnPool({ id, resourceFromQuery })
            )
          )
        } catch {
          // if the query fails, we want to remove the resource from the pool
          dispatch(
            datastoreApi.util.updateQueryData(
              'getDatastores',
              undefined,
              removeResourceOnPool({ id })
            )
          )
        }
      },
    }),
    allocateDatastore: builder.mutation({
      /**
       * Allocates a new datastore in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.template - The string containing the template of the resource on syntax XML
       * @param {number|'-1'} params.cluster - The cluster ID. If it's -1, the default one will be used
       * @returns {number} The allocated datastore id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.DATASTORE_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [DATASTORE_POOL],
    }),
    removeDatastore: builder.mutation({
      /**
       * Deletes the given datastore from the pool.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - Datastore id
       * @returns {number} Datastore id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.DATASTORE_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [DATASTORE_POOL],
    }),
    updateDatastore: builder.mutation({
      /**
       * Replaces the datastore contents.
       *
       * @param {object} params - Request params
       * @param {number|string} params.id - Datastore id
       * @param {string} params.template - The new template contents
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} Datastore id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.DATASTORE_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: DATASTORE, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchDatastore = dispatch(
            datastoreApi.util.updateQueryData(
              'getDatastore',
              { id: params.id },
              updateTemplateOnResource(params)
            )
          )

          const patchDatastores = dispatch(
            datastoreApi.util.updateQueryData(
              'getDatastores',
              undefined,
              updateTemplateOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchDatastore.undo()
            patchDatastores.undo()
          })
        } catch {}
      },
    }),
    changeDatastorePermissions: builder.mutation({
      /**
       * Changes the permission bits of a datastore.
       * If set any permission to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Datastore id
       * @param {Permission|'-1'} params.ownerUse - User use
       * @param {Permission|'-1'} params.ownerManage - User manage
       * @param {Permission|'-1'} params.ownerAdmin - User administrator
       * @param {Permission|'-1'} params.groupUse - Group use
       * @param {Permission|'-1'} params.groupManage - Group manage
       * @param {Permission|'-1'} params.groupAdmin - Group administrator
       * @param {Permission|'-1'} params.otherUse - Other use
       * @param {Permission|'-1'} params.otherManage - Other manage
       * @param {Permission|'-1'} params.otherAdmin - Other administrator
       * @returns {number} Datastore id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.DATASTORE_CHMOD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: DATASTORE, id }],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchDatastore = dispatch(
            datastoreApi.util.updateQueryData(
              'getDatastore',
              { id: params.id },
              updatePermissionOnResource(params)
            )
          )

          queryFulfilled.catch(patchDatastore.undo)
        } catch {}
      },
    }),
    changeDatastoreOwnership: builder.mutation({
      /**
       * Changes the ownership of a datastore.
       * If set to `-1`, the user or group aren't changed.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Datastore id
       * @param {number|'-1'} params.user - The user id
       * @param {number|'-1'} params.group - The group id
       * @returns {number} Datastore id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.DATASTORE_CHOWN
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: DATASTORE, id }],
      async onQueryStarted(params, { getState, dispatch, queryFulfilled }) {
        try {
          const patchDatastore = dispatch(
            datastoreApi.util.updateQueryData(
              'getDatastore',
              { id: params.id },
              updateOwnershipOnResource(getState(), params)
            )
          )

          queryFulfilled.catch(patchDatastore.undo)
        } catch {}
      },
    }),
    renameDatastore: builder.mutation({
      /**
       * Renames a datastore.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Datastore id
       * @param {string} params.name - The new name
       * @returns {number} Datastore id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.DATASTORE_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [
        { type: DATASTORE, id },
        DATASTORE_POOL,
      ],
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const patchDatastore = dispatch(
            datastoreApi.util.updateQueryData(
              'getDatastore',
              { id: params.id },
              updateNameOnResource(params)
            )
          )

          const patchDatastores = dispatch(
            datastoreApi.util.updateQueryData(
              'getDatastores',
              undefined,
              updateNameOnResource(params)
            )
          )

          queryFulfilled.catch(() => {
            patchDatastore.undo()
            patchDatastores.undo()
          })
        } catch {}
      },
    }),
    enableDatastore: builder.mutation({
      /**
       * Sets the status of the datastore to enabled.
       *
       * @param {number|string} id - Datastore id
       * @returns {number} Datastore id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.DATASTORE_ENABLE
        const command = { name, ...Commands[name] }

        return { params: { id, enable: true }, command }
      },
      invalidatesTags: (_, __, id) => [{ type: DATASTORE, id }, DATASTORE_POOL],
    }),
    disableDatastore: builder.mutation({
      /**
       * Sets the status of the datastore to disabled.
       *
       * @param {number|string} id - Datastore id
       * @returns {number} Datastore id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.DATASTORE_ENABLE
        const command = { name, ...Commands[name] }

        return { params: { id, enable: false }, command }
      },
      invalidatesTags: (_, __, id) => [{ type: DATASTORE, id }, DATASTORE_POOL],
    }),
  }),
})

export const {
  // Queries
  useGetDatastoreQuery,
  useLazyGetDatastoreQuery,
  useGetDatastoresQuery,
  useLazyGetDatastoresQuery,

  // Mutations
  useAllocateDatastoreMutation,
  useRemoveDatastoreMutation,
  useUpdateDatastoreMutation,
  useChangeDatastorePermissionsMutation,
  useChangeDatastoreOwnershipMutation,
  useRenameDatastoreMutation,
  useEnableDatastoreMutation,
  useDisableDatastoreMutation,
} = datastoreApi

export default datastoreApi
