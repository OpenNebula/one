/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { number, object, boolean } from 'yup'
import { getValidationFromFields, arrayToOptions } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'
import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'

const DS_ID = {
  name: 'dsId',
  label: T.BackupDatastore,
  type: INPUT_TYPES.SELECT,
  values: () => {
    const { data: datastores = [] } = useGetDatastoresQuery()

    return arrayToOptions(
      datastores.filter(({ TEMPLATE }) => TEMPLATE.TYPE === 'BACKUP_DS'),
      {
        addEmpty: true,
        getText: ({ NAME, ID } = {}) => `${ID}: ${NAME}`,
        getValue: ({ ID } = {}) => parseInt(ID),
      }
    )
  },
  validation: number()
    .positive()
    .required()
    .default(() => undefined)
    .transform((_, val) => parseInt(val)),
}

const RESET = {
  name: 'reset',
  label: T.ResetBackup,
  type: INPUT_TYPES.SWITCH,
  validation: boolean(),
  grid: { xs: 12 },
}

export const FIELDS = [RESET, DS_ID]

export const SCHEMA = object(getValidationFromFields(FIELDS))
