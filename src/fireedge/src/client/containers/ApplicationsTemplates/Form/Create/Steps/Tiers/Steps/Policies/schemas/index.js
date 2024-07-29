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
import * as yup from 'yup'
import { INPUT_TYPES } from 'client/constants'
import { getValidationFromFields } from 'client/utils'

import { TAB_ID as ELASTICITY_ID, ELASTICITY_TAB_SCHEMA } from './elasticity'
import { TAB_ID as SCHEDULED_ID, SCHEDULED_TAB_SCHEMA } from './scheduled'

import { COOLDOWN } from './fields'

const MIN_VMS = {
  name: 'min_vms',
  label: 'Min. vms',
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  tooltip: 'Minimum number of VMs for elasticity adjustments',
  validation: yup
    .number()
    .typeError('Min. value must be a number')
    .when(ELASTICITY_ID, (value, schema) =>
      value?.length > 0
        ? schema.required('Minimum field is required')
        : schema.notRequired().nullable()
    )
    .transform((value) => (!isNaN(value) ? value : null))
    .default(undefined),
  grid: { sm: 4, md: 4 },
}

const MAX_VMS = {
  name: 'max_vms',
  label: 'Max. vms',
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  tooltip: 'Maximum number of VMs for elasticity adjustments',
  validation: yup
    .number()
    .typeError('Min. value must be a number')
    .moreThan(
      yup.ref(MIN_VMS.name),
      'Max. vms field must be greater than min vms'
    )
    .when(ELASTICITY_ID, (value, schema) =>
      value?.length > 0
        ? schema.required('Maximum field is required')
        : schema.notRequired().nullable()
    )
    .transform((value) => (!isNaN(value) ? value : null))
    .default(undefined),
  grid: { sm: 4, md: 4 },
}

export const POLICIES_FORM_FIELDS = [
  MIN_VMS,
  MAX_VMS,
  {
    ...COOLDOWN,
    tooltip: `
      Cooldown period duration after a scale operation, in seconds.
      If it is not set, the default set in oneflow-server.conf will be used
    `,
    grid: { sm: 4, md: 4 },
  },
]

export const POLICIES_SCHEMA = yup.object({
  ...getValidationFromFields(POLICIES_FORM_FIELDS),
  [ELASTICITY_ID]: ELASTICITY_TAB_SCHEMA,
  [SCHEDULED_ID]: SCHEDULED_TAB_SCHEMA,
})
