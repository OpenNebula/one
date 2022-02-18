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
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { dismissSnackbar } from 'client/features/General/actions'
import { actions } from 'client/features/Auth/slice'
import userApi from 'client/features/OneApi/user'

import { storage } from 'client/utils'
import { APP_URL, JWT_NAME, FILTER_POOL, ONEADMIN_ID } from 'client/constants'

const { ALL_RESOURCES, PRIMARY_GROUP_RESOURCES } = FILTER_POOL

const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${APP_URL}/api/`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.jwt

      // If we have a token set in state,
      // let's assume that we should be passing it.
      token && headers.set('authorization', `Bearer ${token}`)

      return headers
    },
  }),
  endpoints: (builder) => ({
    getAuthUser: builder.query({
      /**
       * @returns {object} Information about authenticated user
       * @throws Fails when response isn't code 200
       */
      query: () => ({ url: 'user/info' }),
      transformResponse: (response) => response?.data?.USER,
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          const { data: user } = await queryFulfilled
          dispatch(actions.changeAuthUser({ user }))
        } catch {}
      },
    }),
    login: builder.mutation({
      /**
       * @param {object} data - User credentials
       * @param {string} data.user - Username
       * @param {string} data.token - Password
       * @param {boolean} [data.remember] - Remember session
       * @param {string} [data.token2fa] - Token for Two factor authentication
       * @returns {object} Response data from request
       * @throws Fails when response isn't code 200
       */
      query: (data) => ({ url: 'auth', method: 'POST', body: data }),
      transformResponse: (response) => {
        const { id, token } = response?.data
        const isOneAdmin = id === ONEADMIN_ID

        return {
          jwt: token,
          user: { ID: id },
          isLoginInProgress: !!token && !isOneAdmin,
        }
      },
      async onQueryStarted({ remember }, { queryFulfilled, dispatch }) {
        try {
          const { data: queryData } = await queryFulfilled

          if (queryData?.jwt) {
            storage(JWT_NAME, queryData?.jwt, remember)
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
