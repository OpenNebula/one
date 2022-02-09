/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import * as yup from 'yup'

import * as COMMON_FIELDS from 'client/components/Forms/Vm/AttachDiskForm/CommonFields'
import { INPUT_TYPES, HYPERVISORS } from 'client/constants'
import { getValidationFromFields } from 'client/utils'

const { vcenter } = HYPERVISORS

const SIZE = {
  name: 'SIZE',
  label: 'Size on instantiate',
  tooltip: `
    The size of the disk will be modified to match
    this size when the template is instantiated`,
  notOnHypervisors: [vcenter],
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: yup
    .number()
    .typeError('Size value must be a number')
    .notRequired()
    .default(undefined),
}

export const FIELDS = (hypervisor) =>
  [SIZE, ...Object.values(COMMON_FIELDS)]
    .map((field) => (typeof field === 'function' ? field(hypervisor) : field))
    .filter(
      ({ notOnHypervisors } = {}) => !notOnHypervisors?.includes?.(hypervisor)
    )

export const SCHEMA = (hypervisor) =>
  yup.object(getValidationFromFields(FIELDS(hypervisor)))
