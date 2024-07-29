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
import { object, array, string } from 'yup'

/** @type {object} Role Group schema */
const ROLE_GROUP_SCHEMA = object().shape({
  AFFINED_GROUPS: array()
    .of(
      array().of(
        string().test(
          'is-string',
          'Malformed affined group(s) definition',
          (value) => typeof value === 'string'
        )
      )
    )
    .notRequired()
    .default(() => []),
  ANTI_AFFINED_GROUPS: array()
    .of(
      array().of(
        string().test(
          'is-string',
          'Malformed anti-affined group(s) definition',
          (value) => typeof value === 'string'
        )
      )
    )
    .notRequired()
    .default(() => []),
})

/** @type {object} Roles schema for the step */
export const SCHEMA = ROLE_GROUP_SCHEMA
