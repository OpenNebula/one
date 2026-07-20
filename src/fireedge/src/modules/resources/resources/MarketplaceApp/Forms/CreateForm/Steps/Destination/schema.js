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
import { object, ObjectSchema, string } from 'yup'

import { INPUT_TYPES, T } from '@ConstantsModule'
import { SystemAPI } from '@FeaturesModule'
import { marketplaceTable, onedConfIncludesAction } from '@ModelsModule'
import { Field, getValidationFromFields } from '@UtilsModule'

const MARKETPLACE_COLUMN_IDS = [
  'ID',
  'NAME',
  'STATE',
  'capacity',
  'UNAME',
  'GNAME',
]

const marketplaceModel = {
  dataCy: marketplaceTable.dataCy,
  columns: () => {
    const columns = marketplaceTable.columns()

    return MARKETPLACE_COLUMN_IDS.map((id) =>
      columns.find((column) => (column.id ?? column.accessorKey) === id)
    ).filter(Boolean)
  },
  useData: () => {
    const result = marketplaceTable.useData()
    const { data: oneConfig = {} } = SystemAPI.useGetOneConfigQuery()

    return {
      ...result,
      data: []
        .concat(result?.data ?? [])
        .filter((marketplace) =>
          onedConfIncludesAction(marketplace, oneConfig, 'create')
        ),
    }
  },
}

/** @type {Field} Marketplace field */
const MARKETPLACE = {
  name: 'marketId',
  label: T.SelectMarketplace,
  tooltip: T.SelectMarketplaceToCreateTheAppConcept,
  type: INPUT_TYPES.TABLE,
  model: marketplaceModel,
  singleSelect: true,
  selectOnRowClick: true,
  fieldProps: {
    preserveState: true,
    isEnableSearchBar: true,
    defaultPageSize: 5,
    pageSizeOptions: [5, 10, 20],
  },
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field[]} Destination fields */
export const FIELDS = [MARKETPLACE]

/** @type {ObjectSchema} Destination schema */
export const SCHEMA = object(getValidationFromFields(FIELDS))
