/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { array, object } from 'yup'

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

const SCHEMA = object({
  AR: array()
    .ensure()
    .transform((actions) => actions.map(mapNameByIndex('AR'))),
})

export { SCHEMA, mapNameByIndex }
