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
import { Actions, Commands } from 'server/utils/constants/commands/user'
import {
  oneApi,
  ONE_RESOURCES,
  ONE_RESOURCES_POOL,
} from 'client/features/OneApi'
import { authApi } from 'client/features/AuthApi'
import { User } from 'client/constants'

const { USER } = ONE_RESOURCES
const { USER_POOL } = ONE_RESOURCES_POOL

const userApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      /**
       * Retrieves information for all the users in the pool.
       *
       * @returns {User[]} List of users
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.USER_POOL_INFO
        const command = { name, ...Commands[name] }

        return { command }
      },
      transformResponse: (data) => [data?.USER_POOL?.USER ?? []].flat(),
      providesTags: (users) =>
        users
          ? [
              ...users.map(({ ID }) => ({ type: USER_POOL, id: `${ID}` })),
              USER_POOL,
            ]
          : [USER_POOL],
    }),
    getUser: builder.query({
      /**
       * Retrieves information for the user.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - User id
       * @returns {User} Get user identified by id
       * @throws Fails when response isn't code 200
       */
      query: ({ id }) => {
        const name = Actions.USER_INFO
        const command = { name, ...Commands[name] }

        return { params: { id }, command }
      },
      transformResponse: (data) => data?.USER ?? {},
      providesTags: (_, __, { id }) => [{ type: USER, id }],
    }),
    allocateUser: builder.mutation({
      /**
       * Allocates a new user in OpenNebula.
       *
       * @param {object} params - Request parameters
       * @param {string} params.username - Username for the new user
       * @param {string} params.password - Password for the new user
       * @param {string} params.driver - Authentication driver for the new user.
       * If it is an empty string, then the default 'core' is used
       * @param {string[]} params.group - array of Group IDs.
       * **The first ID will be used as the main group.**
       * This array can be empty, in which case the default group will be used
       * @returns {number} The allocated User id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.USER_ALLOCATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: [USER_POOL],
    }),
    updateUser: builder.mutation({
      /**
       * Replaces the user template contents.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - User id
       * @param {string} params.template - The new user template contents on syntax XML
       * @param {0|1} params.replace
       * - Update type:
       * ``0``: Replace the whole template.
       * ``1``: Merge new template with the existing one.
       * @returns {number} User id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.USER_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: USER, id }],
      async onQueryStarted({ id }, { queryFulfilled, dispatch, getState }) {
        try {
          await queryFulfilled

          if (+id === +getState().auth.user.ID) {
            await dispatch(
              authApi.endpoints.getAuthUser.initiate(undefined, {
                forceRefetch: true,
              })
            )
          }
        } catch {}
      },
    }),
    removeUser: builder.mutation({
      /**
       * Deletes the given user from the pool.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - User id
       * @returns {number} User id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.USER_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: USER, id }, USER_POOL],
    }),
    changePassword: builder.mutation({
      /**
       * Changes the password for the given user.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - User id
       * @param {string} params.password - The new password
       * @returns {number} User id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.USER_PASSWD
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: USER, id }],
    }),
    changeAuthDriver: builder.mutation({
      /**
       * Changes the authentication driver and the password for the given user.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - User id
       * @param {string} params.driver - The new authentication driver
       * @param {string} [params.password] - The new password.
       * If it is an empty string, the password is not changed.
       * @returns {number} User id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.USER_CHAUTH
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: USER, id }],
    }),
    changeGroup: builder.mutation({
      /**
       * Changes the group of the given user.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - User id
       * @param {string|number} params.group - New group
       * @returns {number} User id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.USER_CHGRP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: USER, id }],
      async onQueryStarted({ id, group }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled

          dispatch(
            userApi.util.updateQueryData('getUsers', undefined, (draft) => {
              const user = draft.find(({ ID }) => +ID === +id)
              user && (user.GID = group)
            })
          )

          dispatch(
            userApi.util.updateQueryData('getUser', id, (draftUser) => {
              draftUser.GID = group
            })
          )
        } catch {}
      },
    }),
    addToGroup: builder.mutation({
      /**
       * Adds the User to a secondary group.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - User id
       * @param {string|number} params.group - The Group id of the new group
       * @returns {number} User id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.USER_ADDGROUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: USER, id }, USER_POOL],
    }),
    removeFromGroup: builder.mutation({
      /**
       * Removes the User from a secondary group.
       *
       * @param {object} params - Request parameters
       * @param {string|number} params.id - User id
       * @param {string|number} params.group - The Group id
       * @returns {number} User id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.USER_DELGROUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: USER, id }, USER_POOL],
    }),
    enableUser: builder.mutation({
      /**
       * Enables a user.
       *
       * @param {string|number} id - User id
       * @returns {number} User id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.USER_ENABLE
        const command = { name, ...Commands[name] }

        return { params: { id, enable: false }, command }
      },
      invalidatesTags: (_, __, id) => [{ type: USER, id }, USER_POOL],
    }),
    disableUser: builder.mutation({
      /**
       * Disables a user.
       *
       * @param {string|number} id - User id
       * @returns {number} User id
       * @throws Fails when response isn't code 200
       */
      query: (id) => {
        const name = Actions.USER_ENABLE
        const command = { name, ...Commands[name] }

        return { params: { id, enable: false }, command }
      },
      invalidatesTags: (_, __, id) => [{ type: USER, id }, USER_POOL],
    }),
    getUserQuota: builder.query({
      /**
       * Returns the default user quota limits.
       *
       * @returns {string} The quota template contents
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.USER_QUOTA_INFO
        const command = { name, ...Commands[name] }

        return { command }
      },
    }),
    updateUserQuota: builder.mutation({
      /**
       * Sets the user quota limits.
       *
       * @param {object} params - Request parameters
       * @param {string} params.id - User id
       * @param {string} params.template - The new quota template contents on syntax XML
       * @returns {number} User id
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.USER_QUOTA
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      invalidatesTags: (_, __, { id }) => [{ type: USER, id }],
    }),
    updateDefaultUserQuota: builder.mutation({
      /**
       * Returns the default user quota limits.
       *
       * @param {object} params - Request parameters
       * @param {string} params.template - The new quota template contents on syntax XML
       * @returns {string} The quota template contents
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.USER_QUOTA_UPDATE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
  }),
})

export const {
  // Queries
  useGetUserQuery,
  useLazyGetUserQuery,
  useGetUsersQuery,
  useLazyGetUsersQuery,
  useGetUserQuotaQuery,
  useLazyGetUserQuotaQuery,

  // Mutations
  useAllocateUserMutation,
  useUpdateUserMutation,
  useRemoveUserMutation,
  useChangePasswordMutation,
  useChangeAuthDriverMutation,
  useChangeGroupMutation,
  useAddToGroupMutation,
  useRemoveFromGroupMutation,
  useEnableUserMutation,
  useDisableUserMutation,
  useUpdateUserQuotaMutation,
  useUpdateDefaultUserQuotaMutation,
} = userApi

export default userApi
