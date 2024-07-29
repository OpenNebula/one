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

import { T, INPUT_TYPES } from 'client/constants'

import { mixed } from 'yup'
import { getObjectSchemaFromFields } from 'client/utils'
import { VRouterTemplatesTable } from 'client/components/Tables'

const TEMPLATEID = {
  name: 'vmTemplate',
  type: INPUT_TYPES.TABLE,
  label: T.VirtualRouterTemplate,
  cy: 'vmTemplate',
  Table: () => VRouterTemplatesTable,
  singleSelect: true,
  fieldProps: {
    preserveState: true,
  },
  validation: mixed()
    .required()
    .default(() => null),
  grid: { md: 12 },
}

export const FIELDS = [TEMPLATEID]

export const SCHEMA = getObjectSchemaFromFields(FIELDS)
