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
import { BaseSchema, string } from 'yup'

import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field, Section, getObjectSchemaFromFields } from '@UtilsModule'

/**
 * @param {object} vnTemplate - VN Template
 * @returns {Field} Name field
 */
const NAME = (vnTemplate = {}) => ({
  name: 'name',
  label: T.VNName,
  tooltip: T.VnTemplateNameHelper,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined),
  grid: { md: 12 },
  fieldProps: {
    placeholder: vnTemplate?.NAME ? `${vnTemplate.NAME}-<vnid>` : undefined,
  },
})

/** @type {Field} Description field */
const DESCRIPTION = {
  name: 'DESCRIPTION',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 },
}

/**
 * @param {object} vnTemplate - VN Template
 * @returns {Field[]} List of information fields
 */
const FIELDS = (vnTemplate) => [NAME(vnTemplate), DESCRIPTION]

/**
 * @param {object} vnTemplate - VN Template
 * @returns {Section[]} Sections
 */
const SECTIONS = (vnTemplate) => [
  {
    id: 'information',
    legend: T.Information,
    fields: FIELDS(vnTemplate),
  },
]

/**
 * @param {object} vnTemplate - VN Template
 * @returns {BaseSchema} Step schema
 */
const SCHEMA = (vnTemplate) =>
  getObjectSchemaFromFields(
    SECTIONS(vnTemplate)
      .map(({ fields }) => fields)
      .flat()
  )

export { SCHEMA, SECTIONS }
