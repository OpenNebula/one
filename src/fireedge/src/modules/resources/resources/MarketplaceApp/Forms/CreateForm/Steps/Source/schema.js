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
import { ObjectSchema, string } from 'yup'

import { DatastoreAPI, SystemAPI } from '@FeaturesModule'
import { StatusTag } from '@ComponentsV2Module'
import {
  Field,
  arrayToOptions,
  encodeBase64,
  getObjectSchemaFromFields,
  sentenceCase,
} from '@UtilsModule'
import {
  getImageState,
  imageTable,
  isMarketExportSupport,
  vmsTable,
  vmtemplateTable,
} from '@ModelsModule'
import { INPUT_TYPES, RESOURCE_NAMES, T } from '@ConstantsModule'

export const TYPES = {
  IMAGE: RESOURCE_NAMES.IMAGE.toUpperCase(),
  VM: RESOURCE_NAMES.VM.toUpperCase(),
  VM_TEMPLATE: RESOURCE_NAMES.VM_TEMPLATE.toUpperCase(),
}

const RESOURCE_TABLES = {
  [TYPES.IMAGE]: imageTable,
  [TYPES.VM]: vmsTable,
  [TYPES.VM_TEMPLATE]: vmtemplateTable,
}

const IMAGE_COLUMN_IDS = ['id', 'name', 'state', 'datastore']
const VM_COLUMN_IDS = ['id', 'name']

const getResourceColumns = (type) => {
  const columns = RESOURCE_TABLES[type]?.columns?.() ?? imageTable.columns()

  if (type === TYPES.IMAGE) {
    return IMAGE_COLUMN_IDS.map((id) =>
      columns.find((column) => column.id === id)
    )
      .filter(Boolean)
      .map((column) => {
        if (column.id !== 'state') return column

        return {
          ...column,
          cell: ({ row }) => {
            const { color, name } = getImageState(row.original) ?? {}

            return <StatusTag statusColor={color} statusName={name} />
          },
        }
      })
  }

  if (type === TYPES.VM_TEMPLATE) {
    return columns.filter(
      ({ id, accessorKey }) =>
        id !== 'labels' && !['UNAME', 'GNAME', 'REGTIME'].includes(accessorKey)
    )
  }

  if (type !== TYPES.VM) return columns

  return VM_COLUMN_IDS.map((id) =>
    columns.find((column) => column.id === id)
  ).filter(Boolean)
}

const getResourceModel = (type) => ({
  dataCy: RESOURCE_TABLES[type]?.dataCy,
  columns: () => getResourceColumns(type),
  useData: () => {
    const isImage = type === TYPES.IMAGE
    const isVm = type === TYPES.VM
    const isVmTemplate = type === TYPES.VM_TEMPLATE
    const imageResult = imageTable.useData(undefined, { skip: !isImage })
    const vmResult = vmsTable.useData(
      { state: 8 },
      {
        skip: !isVm,
      }
    )
    const vmTemplateResult = vmtemplateTable.useData(undefined, {
      skip: !isVmTemplate,
    })
    const { data: oneConfig = {} } = SystemAPI.useGetOneConfigQuery(undefined, {
      skip: !isImage,
    })
    const { data: datastores = [] } = DatastoreAPI.useGetDatastoresQuery(
      undefined,
      { skip: !isImage }
    )

    if (!isImage) return isVm ? vmResult : vmTemplateResult

    return {
      ...imageResult,
      data: [].concat(imageResult?.data ?? []).filter((image) => {
        const datastore = datastores.find(
          ({ ID }) => String(ID) === String(image?.DATASTORE_ID)
        )

        return isMarketExportSupport(datastore, oneConfig)
      }),
    }
  },
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
  tooltip: (type) =>
    ({
      [TYPES.IMAGE]: T.SelectImageToCreateTheAppConcept,
      [TYPES.VM]: T.SelectVmToCreateTheAppConcept,
    }[type]),
  model: (type) => getResourceModel(type ?? TYPES.IMAGE),
  singleSelect: true,
  selectOnRowClick: true,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
  fieldProps: {
    preserveState: true,
    isEnableSearchBar: true,
    defaultPageSize: 5,
    pageSizeOptions: [5, 10, 20],
  },
}

/** @type {Field[]} Source fields */
export const FIELDS = [TYPE, RES_TABLE]

/** @type {Field[]} Template fields */
export const TEMPLATE_FIELDS = [APP_TEMPLATE, VM_TEMPLATE]

/** @type {ObjectSchema} Source schema */
export const SCHEMA = getObjectSchemaFromFields([...FIELDS, ...TEMPLATE_FIELDS])
