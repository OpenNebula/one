/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { lazy, boolean, string, ObjectSchema, object } from 'yup'
import { Field, getValidationFromFields, arrayToOptions } from '@UtilsModule'
import { T, INPUT_TYPES } from '@ConstantsModule'
import { useAuth } from '@FeaturesModule'
import { labelsToArray } from '@modules/components/List/NestedLabelTree/utils'

/** @type {Field} Label name field */
const LABEL_NAME = {
  name: 'NAME',
  label: T.NewLabelName,
  type: INPUT_TYPES.TEXT,
  grid: { md: 12 },
  validation: string()
    .matches(
      /^[a-zA-Z0-9_-]+$/,
      'Name must only contain alphanumeric characters, "-", "_" and no spaces'
    )
    .required(T.NewLabelname)
    .afterSubmit((value) => `$${value}`),
}

const LABEL_TYPE = {
  name: 'LABEL_TYPE',
  type: INPUT_TYPES.RADIO,
  optionsOnly: true,
  values: [
    { text: T.User, value: 'user' },
    { text: T.Group, value: 'group' },
  ],
  validation: string()
    .trim()
    .required()
    .default(() => 'user'),
  grid: { md: 12 },
}

const PARENT = {
  name: 'PARENT',
  label: T.Parent,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: ['NEST', 'LABEL_TYPE'],
  values: (deps = []) => {
    const [, TYPE] = deps
    const { labels } = useAuth()

    const labelsArray = []
      .concat(labelsToArray(labels)?.[TYPE])
      ?.map((label) => label?.replace(/\$/g, ''))

    return arrayToOptions(labelsArray, { addEmpty: false })
  },

  validation: lazy((_, { parent = {} } = {}) => {
    const { NEST: isNested, LABEL_TYPE: labelType } = parent

    const isRequired = isNested || labelType === 'group'

    const validation = isRequired ? string().required() : string().notRequired()

    return validation
  }),
  grid: { md: 12 },
}

const NEST = {
  name: 'NEST',
  label: T.NestLabelUnder,
  type: INPUT_TYPES.CHECKBOX,
  grid: { md: 12 },
  dependOf: ['PARENT', 'LABEL_TYPE'],
  watcher: (deps = []) => {
    const [parent, type] = deps

    return Boolean(parent) || type === 'group'
  },

  validation: boolean().default(() => false),
  fieldProps: (deps = []) => {
    const [, type] = deps

    return { disabled: type === 'group' }
  },
}

/**
 * @returns {Field[]} List of label fields
 */
export const FIELDS = [LABEL_NAME, LABEL_TYPE, NEST, PARENT]

/** @type {ObjectSchema} label object schema */
export const SCHEMA = object(getValidationFromFields(FIELDS))
