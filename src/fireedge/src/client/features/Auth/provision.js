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
/* eslint-disable jsdoc/require-jsdoc */
import { createAsyncThunk } from '@reduxjs/toolkit'

import { authService } from 'client/features/Auth/services'
import { logout } from 'client/features/Auth/actions'

import { httpCodes } from 'server/utils/constants'
import { T } from 'client/constants'

export const getProviderConfig = createAsyncThunk(
  'provision/provider-config',
  async (_, { dispatch }) => {
    try {
      const config = (await authService.getProviderConfig()) ?? {}

      return { providerConfig: config }
    } catch (error) {
      error?.status === httpCodes.unauthorized.id &&
        dispatch(logout(T.SessionExpired))
    }
  }
)
