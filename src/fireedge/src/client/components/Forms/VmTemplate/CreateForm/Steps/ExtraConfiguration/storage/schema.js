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
import { object, string, array, ObjectSchema } from 'yup'

import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'
import { getDeployMode } from 'client/models/Datastore'
import { T, INPUT_TYPES } from 'client/constants'
import { Field, arrayToOptions, getValidationFromFields } from 'client/utils'
import { mapNameByIndex } from '../schema'

/** @returns {Field} Deploy mode field */
const TM_MAD_SYSTEM = {
  name: 'TM_MAD_SYSTEM',
  label: T.DeployMode,
  tooltip: T.DeployModeConcept,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () => {
    const { data: datastores = [] } = useGetDatastoresQuery()
    const modes = datastores.map(getDeployMode)?.flat()

    return arrayToOptions([...new Set(modes)], { addEmpty: 'Default' })
  },
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

/** @type {Field[]} List of Storage fields */
const FIELDS = [TM_MAD_SYSTEM]

/** @type {ObjectSchema} Storage schema */
const SCHEMA = object({
  ...getValidationFromFields(FIELDS),
  DISK: array()
    .ensure()
    .transform((disks) => disks.map(mapNameByIndex('DISK'))),
})

export { FIELDS, SCHEMA }
