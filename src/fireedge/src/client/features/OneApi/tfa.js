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
import { oneApi } from 'client/features/OneApi'
import { Actions, Commands } from 'server/routes/api/2fa/routes'

const tfaApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getQr: builder.query({
      /**
       * Get Qr for 2FA.
       *
       * @param {object} params - Qr params
       * @returns {object} Information about authenticated user
       * @throws Fails when response isn't code 200
       */
      query: (params) => {
        const name = Actions.TFA_QR
        const command = { name, ...Commands[name] }

        return { params, command }
      },
      transformResponse: (response) => response?.img,
    }),
    enableTfa: builder.mutation({
      query: (params) => {
        const name = Actions.TFA_SETUP
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
    removeTfa: builder.mutation({
      query: (params) => {
        const name = Actions.TFA_DELETE
        const command = { name, ...Commands[name] }

        return { params, command }
      },
    }),
  }),
})

export const {
  // Queries
  useGetQrQuery,

  // Mutations
  useEnableTfaMutation,
  useRemoveTfaMutation,
} = tfaApi

export default tfaApi
