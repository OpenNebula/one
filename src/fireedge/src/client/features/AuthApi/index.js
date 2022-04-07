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
import { createApi } from '@reduxjs/toolkit/query/react'

import { Actions, Commands } from 'server/routes/api/auth/routes'
import { dismissSnackbar } from 'client/features/General/actions'
import { actions } from 'client/features/Auth/slice'
import userApi from 'client/features/OneApi/user'

import http from 'client/utils/rest'
import { requestConfig, storage } from 'client/utils'
import { JWT_NAME, FILTER_POOL, ONEADMIN_ID } from 'client/constants'

const { ALL_RESOURCES, PRIMARY_GROUP_RESOURCES } = FILTER_POOL

const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: async ({ params, command, needState }, { getState, signal }) => {
    try {
      const config = requestConfig(params, command)
      const response = await http.request({ ...config, signal })
      const state = needState ? getState() : {}

      return { data: response.data ?? {}, meta: { state } }
    } catch (axiosError) {
      const { message, data = {}, status, statusText } = axiosError
      const { message: messageFromServer, data: errorFromOned } = data

      const error = message ?? errorFromOned ?? messageFromServer ?? statusText

      return { error: { status: status, data: error } }
    }
  },
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
          dispatch(actions.changeAuthUser({ user }))
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

          if (queryData?.jwt) {
            storage(JWT_NAME, queryData?.jwt)
            dispatch(dismissSnackbar({ dismissAll: true }))
          }

          dispatch(actions.changeAuthUser(queryData))
        } catch {}
      },
    }),
    changeAuthGroup: builder.mutation({
      /**
       * @param {object} data - User credentials
       * @param {string} data.group - Group id
       * @returns {Promise} Response data from request
       * @throws Fails when response isn't code 200
       */
      queryFn: async ({ group } = {}, { getState, dispatch }) => {
        try {
          if (group === ALL_RESOURCES) {
            dispatch(actions.changeFilterPool(ALL_RESOURCES))

            return { data: '' }
          }

          const authUser = getState().auth.user
          const queryData = { id: authUser.ID, group: group }

          const response = await dispatch(
            userApi.endpoints.changeGroup.initiate(queryData)
          ).unwrap()

          dispatch(actions.changeFilterPool(PRIMARY_GROUP_RESOURCES))

          return { data: response }
        } catch (error) {
          return { error }
        }
      },
    }),
  }),
})

export const {
  useGetAuthUserQuery,
  useLazyGetAuthUserQuery,

  useLoginMutation,
  useChangeAuthGroupMutation,
} = authApi

export { authApi }
