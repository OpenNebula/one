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
import { string, ObjectSchema, array } from 'yup'

import { T, INPUT_TYPES, IMAGE_TYPES_STR } from 'client/constants'
import {
  Field,
  filterFieldsByHypervisor,
  getObjectSchemaFromFields,
  arrayToOptions,
  OPTION_SORTERS,
} from 'client/utils'

import { useGetAllImagesQuery } from 'client/features/OneApi/image'
import * as ImageModel from 'client/models/Image'

/** @type {Field} Files ds field */
export const FILES_DS = {
  name: 'CONTEXT.FILES_DS',
  label: T.ContextFiles,
  tooltip: T.ContextFilesConcept,
  type: INPUT_TYPES.AUTOCOMPLETE,
  multiple: true,
  disableEnter: true,
  values: () => {
    // Get images
    const { data: images = [] } = useGetAllImagesQuery()

    // Filter by context images only that are the ones valid to use in this attribute
    const contextImages = images.filter(
      (image) => ImageModel.getType(image) === IMAGE_TYPES_STR.CONTEXT
    )

    // Return text and value objects
    return arrayToOptions(contextImages, {
      addEmpty: false,
      getText: ({ ID, NAME }) => `#${ID} ${NAME}`,
      getValue: ({ ID }) => `$FILE[IMAGE_ID=${ID}]`,
      sorter: OPTION_SORTERS.numeric,
    })
  },
  validation: array(string())
    .notRequired()
    .ensure()
    .afterSubmit((value) => value.join(' ')),
  grid: { md: 12 },
  fieldProps: { freeSolo: true },
}

/** @type {Field} Init scripts field */
export const INIT_SCRIPTS = {
  name: 'CONTEXT.INIT_SCRIPTS',
  label: T.InitScripts,
  tooltip: T.InitScriptsConcept,
  type: INPUT_TYPES.AUTOCOMPLETE,
  multiple: true,
  validation: array(string().trim())
    .notRequired()
    .ensure()
    .afterSubmit((value) => value.join(' ')),
  grid: { md: 12 },
  fieldProps: { freeSolo: true },
}

/** @type {Field[]} List of Context Files fields */
export const FILES_FIELDS = (hypervisor) =>
  filterFieldsByHypervisor([INIT_SCRIPTS, FILES_DS], hypervisor)

/** @type {ObjectSchema} Context Files schema */
export const FILES_SCHEMA = (hypervisor) =>
  getObjectSchemaFromFields(FILES_FIELDS(hypervisor))
