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

import { DATASTORE_TYPES, INPUT_TYPES, T } from '@ConstantsModule'
import { datastoreTable } from '@ModelsModule'
import { decodeBase64, Field, getValidationFromFields } from '@UtilsModule'

export const DATASTORE_FIELD = 'datastore'

const getDatastoreType = (app) => {
  const appTemplate = String(decodeBase64(app?.TEMPLATE?.APPTEMPLATE64, ''))

  return appTemplate.includes('TYPE="KERNEL"')
    ? DATASTORE_TYPES.FILE.id
    : DATASTORE_TYPES.IMAGE.id
}

const getDatastoreModel = (app) => ({
  columns: () =>
    datastoreTable
      .columns()
      .filter(({ id }) => !['owner', 'group', 'labels'].includes(id)),
  useData: () =>
    datastoreTable.useData(undefined, {
      selectFromResult: (result) => ({
        ...result,
        data: result?.data?.filter(
          (datastore) => +datastore?.TYPE === getDatastoreType(app)
        ),
      }),
    }),
})

/**
 * @param {object} app - Marketplace app resource
 * @returns {Field[]} Datastore fields
 */
export const getFields = (app) => [
  {
    name: DATASTORE_FIELD,
    label: T.SelectDatastoreImage,
    type: INPUT_TYPES.TABLE,
    model: getDatastoreModel(app),
    singleSelect: true,
    selectOnRowClick: true,
    fieldProps: {
      defaultPageSize: 5,
      isEnableSearchBar: true,
      isEnableSort: true,
      isEnableFilters: true,
      isRowsSelectable: true,
    },
    validation: string()
      .trim()
      .required()
      .default(() => undefined),
    grid: { md: 12 },
  },
]

/**
 * @param {object} app - Marketplace app resource
 * @returns {ObjectSchema} Datastore schema
 */
export const getSchema = (app) =>
  object(getValidationFromFields(getFields(app)))
