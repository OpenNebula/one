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
import { Actions, Commands } from 'server/utils/constants/commands/image'
import {
  oneApi,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
} from 'client/features/OneApi'
import { UpdateFromSocket } from 'client/features/OneApi/socket'
import {
  FilterFlag,
  Image,
  Permission,
  IMAGE_TYPES_STR,
} from 'client/constants'

const { IMAGE } = ONE_RESOURCES
const { IMAGE_POOL } = ONE_RESOURCES_POOL

const imageApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getImages: builder.query({
      /**
       * Retrieves information for all or part of the images in the pool.
       *
       * @param {object} params - Request params
       * @param {FilterFlag} [params.filter] - Filter flag
       * @param {number} [params.start] - Range start ID
       * @param {number} [params.end] - Range end ID
       * @returns {Image[]} List of images
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.IMAGE_POOL_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => [data?.IMAGE_POOL?.IMAGE ?? []].flat(),
      providesTags: (images) =>
        images
          ? [
              ...images.map(({ ID }) => ({ type: IMAGE_POOL, id: `${ID}` })),
              IMAGE_POOL,
            ]
          : [IMAGE_POOL],
    }),
    getImage: builder.query({
      /**
       * Retrieves information for the image.
       *
       * @param {object} params - Request params
       * @param {string|number} params.id - Image id
       * @param {boolean} [params.decrypt] - Optional flag to decrypt contained secrets, valid only for admin
       * @returns {Image} Get Image identified by id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.IMAGE_INFO
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (data) => data?.IMAGE ?? {},
      providesTags: (_, __, { id }) => [{ type: IMAGE, id }],
      onCacheEntryAdded: ({ id }, endpointProps) =>
        UpdateFromSocket({
          updateQueryData: (updateFn) =>
            imageApi.util.updateQueryData('getImages', undefined, updateFn),
          resource: IMAGE.toLowerCase(),
        })(id, endpointProps),
    }),
    allocateImage: builder.mutation({
      /**
       * Allocates a new image in OpenNebula.
       *
       * @param {object} params - Request params
       * @param {string} params.template - A string containing the template of the image on syntax XML
       * @param {string} params.id - The datastore ID
       * @param {boolean} [params.capacity] - `true` to avoid checking datastore capacity
       * @returns {number} Image id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.IMAGE_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [IMAGE_POOL],
    }),
    cloneImage: builder.mutation({
      /**
       * Clones an existing image.
       *
       * @param {object} params - Request params
       * @param {string} params.id - The id of the image to be cloned
       * @param {string} params.name - Name for the new image
       * @param {string|-1} [params.datastore] - The ID of the target datastore
       * @returns {number} The new image id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.IMAGE_CLONE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [IMAGE_POOL],
    }),
    removeImage: builder.mutation({
      /**
       * Deletes the given image from the pool.
       *
       * @param {object} params - Request params
       * @param {string} params.id - The object id
       * @returns {number} Image id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.IMAGE_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [IMAGE_POOL],
    }),
    enableImage: builder.mutation({
      /**
       * Enables an image.
       *
       * @param {string} id - Image id
       * @returns {number} Image id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.IMAGE_ENABLE
        const command = { name, ...Commands[name] }

        return { params: { id, enable: true }, command }
      },
      invalidatesTags: (_, __, id) => [{ type: IMAGE, id }, IMAGE_POOL],
    }),
    disableImage: builder.mutation({
      /**
       * Disables an image.
       *
       * @param {string} id - Image id
       * @returns {number} Image id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.IMAGE_ENABLE
        const command = { name, ...Commands[name] }

        return { params: { id, enable: false }, command }
      },
      invalidatesTags: (_, __, id) => [{ type: IMAGE, id }, IMAGE_POOL],
    }),
    persistentImage: builder.mutation({
      /**
       * Sets the Image as persistent or not persistent.
       *
       * @param {number|string} params - Request params
       * @param {string} params.id - Image id
       * @param {boolean} params.persistent - `True` for persistent
       * @returns {number} Image id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.IMAGE_PERSISTENT
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, id) => [{ type: IMAGE, id }, IMAGE_POOL],
    }),
    changeImageType: builder.mutation({
      /**
       * Changes the type of an Image.
       *
       * @param {number|string} params - Request params
       * @param {string} params.id - Image id
       * @param {IMAGE_TYPES_STR} params.type - New type for the Image
       * @returns {number} Image id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.IMAGE_CHTYPE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, id) => [{ type: IMAGE, id }, IMAGE_POOL],
    }),
    updateImage: builder.mutation({
      /**
       * Replaces the image template contents.
       *
       * @param {number|string} params - Request params
       * @param {string} params.id - Image id
       * @param {string} params.template - The new template contents on syntax XML
       * @returns {number} Image id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.IMAGE_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, id) => [{ type: IMAGE, id }],
    }),
    changeImagePermissions: builder.mutation({
      /**
       * Changes the permission bits of a Image.
       * If set any permission to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Image id
       * @param {Permission|'-1'} params.ownerUse - User use
       * @param {Permission|'-1'} params.ownerManage - User manage
       * @param {Permission|'-1'} params.ownerAdmin - User administrator
       * @param {Permission|'-1'} params.groupUse - Group use
       * @param {Permission|'-1'} params.groupManage - Group manage
       * @param {Permission|'-1'} params.groupAdmin - Group administrator
       * @param {Permission|'-1'} params.otherUse - Other use
       * @param {Permission|'-1'} params.otherManage - Other manage
       * @param {Permission|'-1'} params.otherAdmin - Other administrator
       * @returns {number} Image id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.IMAGE_CHMOD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: IMAGE, id }],
    }),
    changeImageOwnership: builder.mutation({
      /**
       * Changes the ownership of a Image.
       * If set `user` or `group` to -1, it's not changed.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Image id
       * @param {string|number|'-1'} [params.userId] - User id
       * @param {Permission|'-1'} [params.groupId] - Group id
       * @returns {number} Image id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.IMAGE_CHOWN
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: IMAGE, id }, IMAGE_POOL],
    }),
    renameImage: builder.mutation({
      /**
       * Renames a Image.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Image id
       * @param {string} params.name - The new name
       * @returns {number} Image id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.IMAGE_RENAME
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: IMAGE, id }, IMAGE_POOL],
    }),
    deleteImageSnapshot: builder.mutation({
      /**
       * Deletes a snapshot from the Image.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Image id
       * @param {string} params.snapshot - ID of the snapshot to delete
       * @returns {number} Snapshot ID
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.IMAGE_SNAPDEL
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: IMAGE, id }],
    }),
    revertImageSnapshot: builder.mutation({
      /**
       * Reverts image state to a previous snapshot.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Image id
       * @param {string} params.snapshot - ID of the snapshot to revert to
       * @returns {number} Snapshot ID
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.IMAGE_SNAPREV
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: IMAGE, id }],
    }),
    flattenImageSnapshot: builder.mutation({
      /**
       * Flatten the snapshot of image and discards others.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - Image id
       * @param {string} params.snapshot - ID of the snapshot to revert to
       * @returns {number} Snapshot ID
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.IMAGE_SNAPFLAT
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: IMAGE, id }],
    }),
    lockImage: builder.mutation({
      /**
       * Locks an image. Lock certain actions depending on blocking level.
       * - `USE` (1): locks Admin, Manage and Use actions.
       * - `MANAGE` (2): locks Manage and Use actions.
       * - `ADMIN` (3): locks only Admin actions.
       * - `ALL` (4): locks all actions.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Image id
       * @param {'1'|'2'|'3'|'4'} params.lock - Lock level
       * @returns {number} Image id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.IMAGE_LOCK
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: IMAGE, id }, IMAGE_POOL],
    }),
    unlockImage: builder.mutation({
      /**
       * Unlocks an image.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - Image id
       * @returns {number} Image id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.IMAGE_UNLOCK
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, id) => [{ type: IMAGE, id }, IMAGE_POOL],
    }),
  }),
})

export const {
  // Queries
  useGetImageQuery,
  useLazyGetImageQuery,
  useGetImagesQuery,
  useLazyGetImagesQuery,

  // Mutations
  useAllocateImageMutation,
  useCloneImageMutation,
  useRemoveImageMutation,
  useEnableImageMutation,
  useDisableImageMutation,
  usePersistentImageMutation,
  useChangeImageTypeMutation,
  useUpdateImageMutation,
  useChangeImagePermissionsMutation,
  useChangeImageOwnershipMutation,
  useRenameImageMutation,
  useDeleteImageSnapshotMutation,
  useRevertImageSnapshotMutation,
  useFlattenImageSnapshotMutation,
  useLockImageMutation,
  useUnlockImageMutation,
} = imageApi
