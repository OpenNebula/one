/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { string, array } from 'yup'
import { HostsTable } from '@modules/components/Tables'

/** @type {Field} HostsTable field */
const HOSTS = {
  name: 'ID',
  label: T.SelectHosts,
  type: INPUT_TYPES.TABLE,
  Table: () => HostsTable.Table,
  singleSelect: false,
  validation: array(string().trim()).default(() => undefined),
  grid: { md: 12 },
  fieldProps: {
    preserveState: true,
  },
}

const FIELDS = [HOSTS]

const SCHEMA = getObjectSchemaFromFields(FIELDS)

export { SCHEMA, FIELDS }
