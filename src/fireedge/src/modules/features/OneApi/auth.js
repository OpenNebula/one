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
import { Actions, Commands } from 'server/routes/api/auth/routes'

import { AuthSlice, logout } from '@modules/features/Auth/slice'
import { ONE_RESOURCES_POOL } from '@modules/features/OneApi/resources'
import { oneApi } from '@modules/features/OneApi/oneApi'

import { jsonToXml } from '@ModelsModule'
import { FILTER_POOL } from '@ConstantsModule'
const { actions: authActions } = AuthSlice

const { GROUP_POOL, ...restOfPool } = ONE_RESOURCES_POOL
const {
  ALL_RESOURCES,
  PRIMARY_GROUP_RESOURCES,
  USER_RESOURCES,
  USER_GROUPS_RESOURCES,
} = FILTER_POOL

const authApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuthUser: builder.query({
      /**
       * @returns {object} Information about authenticated user
       * @throws Fails when response isn't code 200
       */
      query: () => ({ command: { path: '/user/info' } }),
      transformResponse: (response) => response?.USER,
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data: user } = await queryFulfilled
          dispatch(authActions.changeAuthUser(user))
        } catch {
        } finally {
          dispatch(authActions.setSessionVerified())
        }
      },
    }),
    login: builder.mutation({
      /**
       * Login in the interface.
       *
       * @param {object} params - User credentials
       * @param {string} params.user - Username
       * @param {string} params.token - Password
       * @param {boolean} [params.remember] - Remember session
       * @param {string} [params.tfatoken] - Token for Two factor authentication
       * @returns {object} Response data from request
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.AUTHENTICATION
        const command = { name, ...Commands[name] }

        return { params, command, needState: true }
      },
      transformResponse: (response, meta) => {
        const { withGroupSwitcher } = meta?.state?.general ?? {}

        return {
          ...response,
          isLoginInProgress: withGroupSwitcher,
        }
      },
    }),
    logout: builder.mutation({
      /**
       * Logout from the interface.
       * Session token is automatically sent by axios, so no need to specify any auth params for logout.
       * This route requests to invalidate early the session cookie.
       *
       * @returns {object} Response data from request
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.LOGOUT
        const command = { name, ...Commands[name] }

        return { command }
      },
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled
        } catch {
        } finally {
          dispatch(logout())
          dispatch(oneApi.util.resetApiState())
        }
      },
    }),
    changeAuthGroup: builder.mutation({
      /**
       * @param {object} params - Request parameters
       * @param {string} params.group - Group id
       * @returns {Promise} Response data from request
       * @throws Fails when response isn't code 200
       */
      queryFn: async ({ group } = {}, { getState, dispatch }) => {
        try {
          if (
            group === ALL_RESOURCES ||
            group === USER_GROUPS_RESOURCES ||
            group === USER_RESOURCES
          ) {
            dispatch(authActions.changeFilterPool(group))

            return { data: '' }
          }

          const authUser = getState().auth.user
          const queryData = { id: authUser.ID, group }

          const newGroup = await dispatch(
            oneApi.endpoints.changeGroup.initiate(queryData)
          ).unwrap()

          dispatch(authActions.changeFilterPool(PRIMARY_GROUP_RESOURCES))
          dispatch(authActions.changeAuthUser({ GID: `${group}` }))

          return { data: newGroup }
        } catch (error) {
          return { error }
        }
      },
      invalidatesTags: [...Object.values(restOfPool)],
    }),
    addLabel: builder.mutation({
      /**
       * @param {object} params - Request parameters
       * @param {string} params.newLabel - Label to add
       * @returns {Promise} Response data from request
       * @throws Fails when response isn't code 200
       */
      queryFn: async ({ newLabel } = {}, { getState, dispatch }) => {
        try {
          if (!newLabel) return { data: '' }

          const authUser = getState().auth.user
          const currentLabels = authUser?.TEMPLATE?.LABELS?.split(',') ?? []

          const exists = currentLabels.some((l) => l === newLabel)
          if (exists) return { data: newLabel }

          const newLabels = currentLabels.concat(newLabel).join(',')
          const template = jsonToXml({ LABELS: newLabels })
          const queryData = { id: authUser.ID, template, replace: 1 }

          await dispatch(
            oneApi.endpoints.updateUser.initiate(queryData)
          ).unwrap()

          return { data: newLabel }
        } catch (error) {
          return { error }
        }
      },
    }),
    removeLabel: builder.mutation({
      /**
       * @param {object} params - Request parameters
       * @param {string} params.label - Label to remove
       * @returns {Promise} Response data from request
       * @throws Fails when response isn't code 200
       */
      queryFn: async ({ label } = {}, { getState, dispatch }) => {
        try {
          if (!label) return { data: '' }

          const authUser = getState().auth.user
          const { LABELS, ...userTemplate } = authUser?.TEMPLATE
          const currentLabels = LABELS?.split(',') ?? []
          const lastLabel = currentLabels?.length <= 1

          const newLabels = currentLabels.filter((l) => l !== label).join()
          const template = lastLabel
            ? jsonToXml(userTemplate)
            : jsonToXml({ LABELS: newLabels })
          const queryData = {
            id: authUser.ID,
            template,
            replace: lastLabel ? 0 : 1,
          }

          await dispatch(
            oneApi.endpoints.updateUser.initiate(queryData)
          ).unwrap()

          return { data: label }
        } catch (error) {
          return { error }
        }
      },
    }),
  }),
})

const authQueries = (({
  // Queries
  useGetAuthUserQuery,
  useLazyGetAuthUserQuery,
  // Mutations
  useLoginMutation,
  useLogoutMutation,
  useChangeAuthGroupMutation,
  useAddLabelMutation,
  useRemoveLabelMutation,
}) => ({
  // Queries
  useGetAuthUserQuery,
  useLazyGetAuthUserQuery,
  // Mutations
  useLoginMutation,
  useLogoutMutation,
  useChangeAuthGroupMutation,
  useAddLabelMutation,
  useRemoveLabelMutation,
}))(authApi)

export default authQueries
