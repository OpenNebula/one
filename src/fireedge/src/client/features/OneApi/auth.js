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
import { Actions, Commands } from 'server/routes/api/auth/routes'

import { actions as authActions } from 'client/features/Auth/slice'
import { dismissSnackbar } from 'client/features/General/actions'
import { oneApi, ONE_RESOURCES_POOL } from 'client/features/OneApi'
import userApi from 'client/features/OneApi/user'

import { jsonToXml } from 'client/models/Helper'
import { storage } from 'client/utils'
import { JWT_NAME, FILTER_POOL, ONEADMIN_ID } from 'client/constants'

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
        } catch {}
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
       * @param {string} [params.token2fa] - Token for Two factor authentication
       * @returns {object} Response data from request
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.AUTHENTICATION
        const command = { name, ...Commands[name] }

        return { params, command, needState: true }
      },
      transformResponse: (response, meta) => {
        const { id, token } = response
        const { withGroupSwitcher } = meta?.state?.general ?? {}
        const isOneAdmin = id === ONEADMIN_ID

        return {
          jwt: token,
          user: { ID: id },
          isLoginInProgress: withGroupSwitcher && !!token && !isOneAdmin,
        }
      },
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data: queryData } = await queryFulfilled
          const { jwt, ...user } = queryData

          if (jwt) {
            storage(JWT_NAME, jwt)
            dispatch(dismissSnackbar({ dismissAll: true }))
          }

          dispatch(authActions.changeJwt(jwt))
          dispatch(authActions.changeAuthUser(user))
        } catch {}
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
            userApi.endpoints.changeGroup.initiate(queryData)
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
            userApi.endpoints.updateUser.initiate(queryData)
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
            userApi.endpoints.updateUser.initiate(queryData)
          ).unwrap()

          return { data: label }
        } catch (error) {
          return { error }
        }
      },
    }),
  }),
})

export const {
  // Queries
  useGetAuthUserQuery,
  useLazyGetAuthUserQuery,

  // Mutations
  useLoginMutation,
  useChangeAuthGroupMutation,
  useAddLabelMutation,
  useRemoveLabelMutation,
} = authApi

export default authApi
