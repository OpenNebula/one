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
import { Field, getObjectSchemaFromFields, isValidRFC1123 } from '@UtilsModule'
import { boolean, string } from 'yup'

const rfc1123Name = () =>
  string()
    .trim()
    .max(63, T.RFC1123MaxLength)
    .required()
    .test('rfc1123-check', T.RFC1123, isValidRFC1123)

/** @type {Field[]} */
export const FIELDS = [
  {
    name: 'RELEASE_NAME',
    label: T.ReleaseName,
    tooltip: T.RFC1123Tooltip,
    type: INPUT_TYPES.TEXT,
    validation: rfc1123Name(),
    grid: { md: 6 },
  },
  {
    name: 'TARGET_NAMESPACE',
    label: T.TargetNamespace,
    tooltip: T.RFC1123Tooltip,
    type: INPUT_TYPES.TEXT,
    validation: rfc1123Name(),
    grid: { md: 6 },
  },
  {
    name: 'CREATE_NAMESPACE',
    label: T.CreateNamespace,
    type: INPUT_TYPES.SWITCH,
    validation: boolean().default(() => true),
    grid: { md: 12 },
  },
]

export const SCHEMA = getObjectSchemaFromFields(FIELDS)
