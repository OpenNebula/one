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
import { ProvidersTable } from '@modules/components/Tables'
import { INPUT_TYPES, T } from '@ConstantsModule'
import { getObjectSchemaFromFields } from '@UtilsModule'
import { string } from 'yup'

const PROVIDER = {
  name: 'PROVIDER',
  label: T.Providers,
  type: INPUT_TYPES.TABLE,
  Table: () => ProvidersTable.Table,
  getRowId: (row) => String(row.ID),
  singleSelect: true,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
  fieldProps: {
    preserveState: true,
    filterData: (providers) =>
      providers.filter((provider) => {
        const driver = provider.TEMPLATE.PROVIDER_BODY.driver

        return driver.toLowerCase() !== 'onprem'
      }),
  },
}

const FIELDS = [PROVIDER]
const SCHEMA = getObjectSchemaFromFields(FIELDS)

export { SCHEMA, FIELDS }
