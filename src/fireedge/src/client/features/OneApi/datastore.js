/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { Actions, Commands } from 'server/utils/constants/commands/datastore'
import {
  oneApi,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
} from 'client/features/OneApi'
import { Permission, Datastore } from 'client/constants'

const { DATASTORE } = ONE_RESOURCES
const { DATASTORE_POOL } = ONE_RESOURCES_POOL

const datastoreApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getDatastores: builder.query({
      /**
       * Retrieves information for all or part of the datastores in the pool.
       *
       * @returns {Datastore[]} List of datastores
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.DATASTORE_POOL_INFO
        const command = { name, ...Commands[name] }

        return { command }
      },
      transformResponse: (data) =>
        [data?.DATASTORE_POOL?.DATASTORE ?? []].flat(),
      providesTags: (datastores) =>
        datastores
          ? [
              ...datastores.map(({ ID }) => ({
                type: DATASTORE_POOL,
                id: `${ID}`,
              })),
              DATASTORE_POOL,
            ]
          : [DATASTORE_POOL],
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
      invalidatesTags: (_, __, { id }) => [{ type: DATASTORE, id }],
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
       * @param {number|string} id - Datastore id
       * @returns {number} Datastore id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.DATASTORE_DELETE
        const command = { name, ...Commands[name] }

        return { params: { id }, command }
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
    }),
    changeDatastorePermissions: builder.mutation({
      /**
       * Changes the permission bits of a virtual network.
       * If set any permission to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Virtual network id
       * @param {Permission|'-1'} params.ownerUse - User use
       * @param {Permission|'-1'} params.ownerManage - User manage
       * @param {Permission|'-1'} params.ownerAdmin - User administrator
       * @param {Permission|'-1'} params.groupUse - Group use
       * @param {Permission|'-1'} params.groupManage - Group manage
       * @param {Permission|'-1'} params.groupAdmin - Group administrator
       * @param {Permission|'-1'} params.otherUse - Other use
       * @param {Permission|'-1'} params.otherManage - Other manage
       * @param {Permission|'-1'} params.otherAdmin - Other administrator
       * @returns {number} Virtual network id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.VN_CHMOD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: DATASTORE, id }],
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
      invalidatesTags: (_, __, { id }) => [
        { type: DATASTORE, id },
        DATASTORE_POOL,
      ],
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
