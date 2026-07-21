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

import { vntemplateTable } from '@ModelsModule'
import { INPUT_TYPES, T } from '@ConstantsModule'
import { getObjectSchemaFromFields } from '@UtilsModule'
import { string, array } from 'yup'

const VNTEMPLATES = {
  name: 'VNTEMPLATES',
  label: T.VNTemplates,
  type: INPUT_TYPES.TABLE,
  dependOf: '$general.ALL_VNETS',
  model: {
    ...vntemplateTable,
    columns: () =>
      vntemplateTable
        .columns()
        .filter(({ id }) => !['owner', 'group', 'time', 'labels'].includes(id)),
    useData: (args, options) =>
      vntemplateTable.useData(args, {
        ...options,
        selectFromResult: (result) => ({
          ...result,
          data: [].concat(result.data ?? []),
        }),
      }),
  },
  singleSelect: false,
  isRefreshTable: true,
  validation: array(string().trim()).when('$general.ALL_VNETS', {
    is: false,
    then: (schema) => schema.required(),
    otherwise: (schema) => schema.notRequired(),
  }),
  grid: { md: 12 },
  fieldProps: {
    defaultPageSize: 5,
    preserveState: true,
    isEnableSearchBar: true,
    isEnableSort: true,
    isEnableFilters: true,
  },
}

const FIELDS = [VNTEMPLATES]

const SCHEMA = getObjectSchemaFromFields(FIELDS)

export { SCHEMA, FIELDS }
