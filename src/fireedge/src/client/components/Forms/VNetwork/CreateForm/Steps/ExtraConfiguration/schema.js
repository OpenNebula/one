/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { array, object, ObjectSchema } from 'yup'

import { SCHEMA as QOS_SCHEMA } from 'client/components/Forms/VNetwork/CreateForm/Steps/ExtraConfiguration/qos/schema'
import { SCHEMA as CONTEXT_SCHEMA } from 'client/components/Forms/VNetwork/CreateForm/Steps/ExtraConfiguration/context/schema'

/**
 * Map name attribute if not exists.
 *
 * @param {string} prefixName - Prefix to add in name
 * @returns {object[]} Resource object
 */
const mapNameByIndex = (prefixName) => (resource, idx) => ({
  ...resource,
  NAME:
    resource?.NAME?.startsWith(prefixName) || !resource?.NAME
      ? `${prefixName}${idx}`
      : resource?.NAME,
})

const AR_SCHEMA = object({
  AR: array()
    .ensure()
    .transform((actions) => actions.map(mapNameByIndex('AR'))),
})

/**
 * @param {boolean} isUpdate - If `true`, the form is being updated
 * @returns {ObjectSchema} Extra configuration schema
 */
export const SCHEMA = (isUpdate) => {
  const schema = object({ SECURITY_GROUPS: array().ensure() })
    .concat(CONTEXT_SCHEMA)
    .concat(QOS_SCHEMA)

  !isUpdate && schema.concat(AR_SCHEMA)

  return schema
}

export { mapNameByIndex, AR_SCHEMA }
