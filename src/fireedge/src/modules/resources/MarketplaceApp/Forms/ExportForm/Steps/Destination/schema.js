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

const isKernelApp = (app) =>
  String(decodeBase64(app?.TEMPLATE?.APPTEMPLATE64, '')).includes(
    'TYPE="KERNEL"'
  )

const getDatastoreModel = (app) => ({
  columns: () =>
    datastoreTable
      .columns()
      .filter(({ id }) => !['owner', 'group', 'labels'].includes(id)),
  useData: () => {
    const result = datastoreTable.useData()
    const kernelApp = isKernelApp(app)

    return {
      ...result,
      data: []
        .concat(result?.data ?? [])
        .filter(
          (datastore) =>
            datastore?.TEMPLATE?.TYPE &&
            kernelApp !==
              (datastore.TEMPLATE.TYPE === DATASTORE_TYPES.IMAGE.value)
        ),
    }
  },
})

/** @type {Field} Datastore field */
const DATASTORE = (app) => ({
  name: 'datastore',
  label: T.SelectDatastore,
  type: INPUT_TYPES.TABLE,
  model: getDatastoreModel(app),
  singleSelect: true,
  selectOnRowClick: true,
  fieldProps: {
    preserveState: true,
    defaultPageSize: 5,
    pageSizeOptions: [5, 10, 20],
  },
  validation: string()
    .trim()
    .required(T.SelectADatastore)
    .default(() => undefined),
  grid: { md: 12 },
})

/**
 * @param {object} app - Marketplace App resource
 * @returns {Field[]} Datastore selection fields
 */
export const FIELDS = (app) => [DATASTORE(app)]

/**
 * @param {object} app - Marketplace App resource
 * @returns {ObjectSchema} Datastore selection schema
 */
export const SCHEMA = (app) => object(getValidationFromFields(FIELDS(app)))
