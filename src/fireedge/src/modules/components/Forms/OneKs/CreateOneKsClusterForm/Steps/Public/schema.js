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
import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field, getObjectSchemaFromFields } from '@UtilsModule'
import { string } from 'yup'
import { VnsTable } from '@modules/components/Tables'

/** @type {Field} Vnets field */
const PUBLIC_NETWORK = {
  name: 'PUBLIC_NETWORK',
  label: T.SelectVirtualNetworks,
  type: INPUT_TYPES.TABLE,
  Table: () => VnsTable.Table,
  singleSelect: true,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
  fieldProps: {
    preserveState: true,
  },
}

const FIELDS = [PUBLIC_NETWORK]

const SCHEMA = getObjectSchemaFromFields(FIELDS)

export { SCHEMA, FIELDS }
