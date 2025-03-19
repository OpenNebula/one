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
import { number } from 'yup'
import { getObjectSchemaFromFields } from '@UtilsModule'
import { INPUT_TYPES, T } from '@ConstantsModule'

const min = {
  name: 'min_vms',
  label: T.RolesMinVms,
  type: INPUT_TYPES.TEXT,
  cy: 'elasticity',
  validation: number()
    .min(0)
    .notRequired()
    .default(() => undefined),
  fieldProps: {
    type: 'number',
  },
  grid: { md: 4 },
}

const max = {
  name: 'max_vms',
  label: T.RolesMaxVms,
  type: INPUT_TYPES.TEXT,
  dependOf: 'cardinality',

  cy: 'elasticity',
  validation: number()
    .min(0)
    .notRequired()
    .default(() => undefined),
  fieldProps: {
    type: 'number',
  },
  grid: { md: 4 },
}

const cooldown = {
  name: 'cooldown',
  label: T.Cooldown,
  type: INPUT_TYPES.TEXT,
  cy: 'elasticity',
  validation: number()
    .min(0)
    .notRequired()
    .default(() => undefined),
  fieldProps: {
    type: 'number',
  },
  grid: { md: 4 },
}

export const MIN_MAX_FIELDS = [min, max, cooldown]

export const MIN_MAX_SCHEMA = getObjectSchemaFromFields(MIN_MAX_FIELDS)
