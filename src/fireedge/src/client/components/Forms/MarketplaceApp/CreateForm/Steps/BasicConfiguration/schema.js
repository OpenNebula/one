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
import { string, boolean, ObjectSchema } from 'yup'
import { makeStyles } from '@mui/styles'

import { useGetOneConfigQuery } from 'client/features/OneApi/system'
import { useGetDatastoresQuery } from 'client/features/OneApi/datastore'
import {
  ImagesTable,
  VmsTable,
  VmTemplatesTable,
} from 'client/components/Tables'
import {
  Field,
  arrayToOptions,
  getObjectSchemaFromFields,
  sentenceCase,
  encodeBase64,
} from 'client/utils'
import { isMarketExportSupport } from 'client/models/Datastore'
import { T, INPUT_TYPES, STATES, RESOURCE_NAMES } from 'client/constants'

export const TYPES = {
  IMAGE: RESOURCE_NAMES.IMAGE.toUpperCase(),
  VM: RESOURCE_NAMES.VM.toUpperCase(),
  VM_TEMPLATE: RESOURCE_NAMES.VM_TEMPLATE.toUpperCase(),
}

const useTableStyles = makeStyles({
  body: { gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' },
})

/** @type {Field} Type field */
const TYPE = {
  name: 'type',
  type: INPUT_TYPES.TOGGLE,
  values: arrayToOptions(Object.values(TYPES), {
    addEmpty: false,
    getText: (type) => sentenceCase(type).toUpperCase(),
  }),
  validation: string()
    .trim()
    .required()
    .uppercase()
    .default(() => TYPES.IMAGE),
  grid: { md: 12 },
}

/** @type {Field} App name field */
const NAME = {
  name: 'vmname',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
}

/** @type {Field} Description field */
const DESCRIPTION = {
  name: 'image.DESCRIPTION',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  dependOf: TYPE.name,
  htmlType: (type) => type !== TYPES.IMAGE && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .default(() => undefined),
}

/** @type {Field} Import image/templates field */
const IMPORT = {
  name: 'associated',
  label: T.ImportAssociateApp,
  type: INPUT_TYPES.SWITCH,
  dependOf: TYPE.name,
  htmlType: (type) => type === TYPES.IMAGE && INPUT_TYPES.HIDDEN,
  validation: boolean().default(() => true),
}

/** @type {Field} App template field */
const APP_TEMPLATE = {
  name: 'image.APPTEMPLATE64',
  label: T.AppTemplate,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined)
    .afterSubmit((value) => encodeBase64(value)),
  fieldProps: { multiline: true, placeholder: 'ATTRIBUTE = "VALUE"' },
}

/** @type {Field} VM template field */
const VM_TEMPLATE = {
  name: 'image.VMTEMPLATE64',
  label: T.VMTemplate,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined)
    .afterSubmit((value) => encodeBase64(value)),
  fieldProps: { multiline: true, placeholder: 'ATTRIBUTE = "VALUE"' },
}

/** @type {Field} Resource table field */
const RES_TABLE = {
  name: 'id',
  type: INPUT_TYPES.TABLE,
  dependOf: TYPE.name,
  label: (type) =>
    ({
      [TYPES.IMAGE]: T.SelectImageToCreateTheApp,
      [TYPES.VM]: T.SelectVmToCreateTheApp,
      [TYPES.VM_TEMPLATE]: T.SelectVmTemplateToCreateTheApp,
    }[type] ?? T.SelectResourceToCreateTheApp),
  Table: (type) =>
    ({
      [TYPES.IMAGE]: ImagesTable,
      [TYPES.VM]: VmsTable,
      [TYPES.VM_TEMPLATE]: VmTemplatesTable,
    }[type]),
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
  fieldProps: (type) => {
    const { data: oneConfig = {} } = useGetOneConfigQuery()
    const { data: datastores = [] } = useGetDatastoresQuery()
    const classes = useTableStyles()

    return {
      [TYPES.IMAGE]: {
        filter: (image) => {
          const datastore = datastores?.find(
            (ds) => ds?.ID === image?.DATASTORE_ID
          )

          return isMarketExportSupport(datastore, oneConfig)
        },
      },
      [TYPES.VM]: {
        initialState: { filters: [{ id: 'state', value: STATES.POWEROFF }] },
      },
      [TYPES.VM_TEMPLATE]: { classes },
    }[type]
  },
}

/** @type {Field[]} - List of fields */
export const FIELDS = [TYPE, NAME, DESCRIPTION, IMPORT, RES_TABLE]

/** @type {Field[]} - List of fields for template section */
export const TEMPLATE_FIELDS = [APP_TEMPLATE, VM_TEMPLATE]

/** @type {ObjectSchema} - Schema form */
export const SCHEMA = getObjectSchemaFromFields([...FIELDS, ...TEMPLATE_FIELDS])
