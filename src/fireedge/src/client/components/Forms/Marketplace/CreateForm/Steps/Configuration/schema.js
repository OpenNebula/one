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
import { getObjectSchemaFromFields } from 'client/utils'

import { FIELDS as COMMON_FIELDS } from './fieldsCommon'
import { FIELDS as HTTP_FIELDS } from './fieldsHttp'
import { FIELDS as S3_FIELDS } from './fieldsS3'
import { FIELDS as LXC_FIELDS } from './fieldsLinuxContainters'

/**
 * Generate all the fields of the Linux Container Marketplace form.
 *
 * @param {boolean} update - If the user is updating or creating the form
 * @returns {Array} - Fields array
 */
const FIELDS = (update) => [
  ...HTTP_FIELDS,
  ...S3_FIELDS,
  ...COMMON_FIELDS,
  ...LXC_FIELDS(update),
]
const SCHEMA = getObjectSchemaFromFields(FIELDS())

export { SCHEMA, FIELDS }
