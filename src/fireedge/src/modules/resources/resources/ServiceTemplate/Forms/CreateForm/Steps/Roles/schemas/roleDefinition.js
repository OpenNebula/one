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
import { INPUT_TYPES, T } from '@ConstantsModule'
import { string, array, number } from 'yup'
import { Field, getObjectSchemaFromFields, arrayToOptions } from '@UtilsModule'
import { vmtemplateTable } from '@ModelsModule'

const selectionVmTemplateTable = {
  ...vmtemplateTable,
  columns: () =>
    vmtemplateTable
      .columns()
      .filter(
        ({ id, accessorKey }) =>
          id !== 'labels' &&
          !['UNAME', 'GNAME', 'REGTIME'].includes(accessorKey)
      ),
}

// export const TAB_ID = 'definition'

/**
 * @returns {object} Empty role used to initialize the roles field array.
 */
export const getDefaultRole = () => ({
  name: '',
  cardinality: 1,
  parents: [],
  template_id: undefined,
  type: 'vm',
})

/** @type {Field} Name field for role */
const NAME = {
  name: 'name',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  dependOf: 'name',
  validation: string()
    .trim()
    .required()
    .default(() => ''),
  grid: { md: 12 },
}

const CARDINALITY = {
  name: 'cardinality',
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  label: T.NumberOfVms,
  validation: number()
    .min(1)
    .default(() => 1),
  grid: { md: 6, sx: { alignSelf: 'flex-start' } },
}

const PARENTS = {
  name: 'parents',
  type: INPUT_TYPES.AUTOCOMPLETE,
  multiple: true,
  label: T.ParentRoles,
  optionsOnly: true,
  tooltip: T.StraightStrategyConcept,
  dependOf: [NAME.name, `$roles`],
  values: (deps = []) => {
    const [ownName, roles] = deps

    const children = roles
      ?.filter((role) => role?.parents?.includes(ownName))
      .map(({ name }) => name)

    const values =
      roles
        ?.map((role) => role?.name)
        ?.filter((role) => ownName !== role)
        ?.filter((role) => !children.includes(role))
        ?.filter(Boolean) ?? []

    return arrayToOptions(values, { addEmpty: false })
  },
  validation: array()
    .of(string().trim())
    .notRequired()
    .default(() => undefined)
    .afterSubmit((value) =>
      Array.isArray(value) && value?.length > 0 ? value : undefined
    ),
  clearInvalid: true, // Clears invalid values
  fieldProps: {
    inputMinHeight: 40,
  },
  grid: { md: 6 },
}

/* eslint-disable jsdoc/require-jsdoc */
export const TEMPLATE_ID_FIELD = {
  name: 'template_id',
  label: T.SelectTemplate,
  type: INPUT_TYPES.TABLE,
  model: selectionVmTemplateTable,
  validation: number()
    .min(0)
    .required()
    .default(() => undefined),
  grid: { md: 12 },
  singleSelect: true,
  fieldProps: {
    preserveState: true,
  },
}

// Does not need to be rendered
const TYPE = {
  name: 'type',
  validation: string()
    .trim()
    .required()
    .oneOf(['vm', 'vr'])
    .default(() => 'vm'),
  htmlType: INPUT_TYPES.HIDDEN,
}

export const ROLE_DEFINITION_FIELDS = [NAME, CARDINALITY, PARENTS, TYPE]

export const ROLE_DEFINITION_SCHEMA = getObjectSchemaFromFields([
  ...ROLE_DEFINITION_FIELDS,
  TEMPLATE_ID_FIELD,
])
