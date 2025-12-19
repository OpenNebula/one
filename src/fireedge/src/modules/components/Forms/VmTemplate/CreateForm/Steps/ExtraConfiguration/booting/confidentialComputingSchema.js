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
import { string } from 'yup'

import {
  CONFIDENTIAL_COMPUTING_TYPES,
  HYPERVISORS,
  INPUT_TYPES,
  T,
} from '@ConstantsModule'
import { Field, arrayToOptions } from '@UtilsModule'

const { lxc } = HYPERVISORS

/** @type {Field} Confidential Computing Type field */
export const CC_TYPE = {
  name: 'MEMORY_ENCRYPTION.TYPE',
  label: T.ConfidentialComputingType,
  notOnHypervisors: [lxc],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.values(CONFIDENTIAL_COMPUTING_TYPES)),
  validation: string()
    .trim()
    .transform((value) => (value === '' ? undefined : value))
    .oneOf([...Object.values(CONFIDENTIAL_COMPUTING_TYPES), undefined, null])
    .notRequired()
    .default(() => undefined),
}

/** @type {Field[]} List of Confidential Computing fields */
export const CONFIDENTIAL_COMPUTING_FIELDS = [CC_TYPE]
