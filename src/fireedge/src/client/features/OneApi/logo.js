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
import { Actions, Commands } from 'server/routes/api/logo/routes'

import { oneApi } from 'client/features/OneApi'

const logoApi = oneApi.injectEndpoints({
  endpoints: (builder) => ({
    getEncodedLogo: builder.query({
      /**
       * @returns {object} Base64 encoded custom logo
       * @throws Fails when response isn't code 200
       */
      query: () => {
        const name = Actions.GET_LOGO
        const command = { name, ...Commands[name] }

        return { command }
      },
      providesTags: (tags) => [{ type: 'LOGO', id: tags?.logoName }],
      keepUnusedDataFor: 600,
    }),
  }),
})

export const {
  // Queries
  useGetEncodedLogoQuery,
  useLazyGetEncodedLogoQuery,
} = logoApi

export default logoApi
