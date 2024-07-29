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
import { ObjectSchema, object } from 'yup'

// get schemas from VmTemplate/CreateForm
import {
  SCHED_ACTION_SCHEMA,
  STORAGE_SCHEMA,
  NETWORK_SCHEMA,
  PLACEMENT_FIELDS,
  BOOT_ORDER_FIELD,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/schema'
import { getObjectSchemaFromFields } from 'client/utils'
import { UserInputObject } from 'client/constants'

/**
 * @param {UserInputObject[]} userInputs - User inputs
 * @returns {ObjectSchema} Extra configuration schema
 */
export const SCHEMA = object()
  .concat(SCHED_ACTION_SCHEMA)
  .concat(NETWORK_SCHEMA)
  .concat(STORAGE_SCHEMA)
  .concat(
    getObjectSchemaFromFields([
      ...PLACEMENT_FIELDS({ instantiate: true }),
      BOOT_ORDER_FIELD,
    ])
  )
