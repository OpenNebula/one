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
import { createAction } from 'client/features/One/utils'
import { systemService } from 'client/features/One/system/services'
import { RESOURCES } from 'client/features/One/slice'

/** @see {@link RESOURCES.system}  */
const SYSTEM = 'system'

export const getOneVersion = createAction(
  `${SYSTEM}/one-version`,
  systemService.getOneVersion,
  (response, one) => ({
    [RESOURCES.system]: {
      ...one[RESOURCES.system],
      version: response,
    },
  })
)

export const getOneConfig = createAction(
  `${SYSTEM}/one-config`,
  systemService.getOneConfig,
  (response, one) => ({
    [RESOURCES.system]: {
      ...one[RESOURCES.system],
      config: response,
    },
  })
)
