/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { string, boolean, object, ObjectSchema } from 'yup'
import { makeStyles } from '@mui/styles'

import { useSystem, useDatastore } from 'client/features/One'
import { ImagesTable, VmsTable, VmTemplatesTable } from 'client/components/Tables'
import { Field, arrayToOptions, getValidationFromFields, sentenceCase } from 'client/utils'
import { isMarketExportSupport } from 'client/models/Datastore'
import { T, INPUT_TYPES, STATES, RESOURCE_NAMES } from 'client/constants'

const TYPES = {
  IMAGE: RESOURCE_NAMES.IMAGE.toUpperCase(),
  VM: RESOURCE_NAMES.VM.toUpperCase(),
  VM_TEMPLATE: RESOURCE_NAMES.VM_TEMPLATE.toUpperCase()
}

const useTableStyles = makeStyles({
  body: { gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }
})

/** @type {Field} Type field */
const TYPE = {
  name: 'type',
  type: INPUT_TYPES.TOGGLE,
  values: arrayToOptions(Object.values(TYPES), {
    addEmpty: false,
    getText: type => sentenceCase(type).toUpperCase()
  }),
  validation: string()
    .trim()
    .required()
    .uppercase()
    .default(() => TYPES.IMAGE),
  grid: { md: 12 }
}

/** @type {Field} App name field */
const NAME = {
  name: 'name',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12, lg: 6 }
}

/** @type {Field} Import image/templates field */
const IMPORT = {
  name: 'image',
  label: T.DontAssociateApp,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { md: 12, lg: 6 }
}

/** @type {Field} Resource table field */
const RES_TABLE = {
  name: 'id',
  type: INPUT_TYPES.TABLE,
  dependOf: 'type',
  label: type => `Select the ${
    sentenceCase(type) ?? 'resource'} to create the App`,
  Table: type => ({
    [TYPES.IMAGE]: ImagesTable,
    [TYPES.VM]: VmsTable,
    [TYPES.VM_TEMPLATE]: VmTemplatesTable
  })[type],
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
  fieldProps: type => {
    const { config: oneConfig } = useSystem()
    const datastores = useDatastore()
    const classes = useTableStyles()

    return {
      [TYPES.IMAGE]: {
        filter: image => {
          const datastore = datastores?.find(ds => ds?.ID === image?.DATASTORE_ID)
          return isMarketExportSupport(datastore, oneConfig)
        }
      },
      [TYPES.VM]: {
        initialState: { filters: [{ id: 'STATE', value: STATES.POWEROFF }] }
      },
      [TYPES.VM_TEMPLATE]: { classes }
    }[type]
  }
}

/** @type {Field[]} - List of fields */
export const FIELDS = [TYPE, NAME, IMPORT, RES_TABLE]

/** @type {ObjectSchema} - Schema form */
export const SCHEMA = object(getValidationFromFields(FIELDS))
