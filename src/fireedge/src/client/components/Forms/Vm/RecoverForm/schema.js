/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { string, object } from 'yup'
import { INPUT_TYPES } from 'client/constants'
import { getValidationFromFields } from 'client/utils'

const OPERATION = {
  name: 'operation',
  label: 'Operation',
  type: INPUT_TYPES.SELECT,
  dependOf: 'operation',
  tooltip: operation => ({
    0: 'Recover a VM by failing the pending action',
    1: 'Recover a VM by succeeding the pending action',
    2: 'Recover a VM by retrying the last failed action',
    3: 'No recover action possible, delete the VM',
    4: 'No recover action possible, delete and recreate the VM',
    5: `No recover action possible, delete the VM from the DB.
        It does not trigger any action on the hypervisor`
  }[operation]),
  values: [
    { text: 'Failure', value: 0 },
    { text: 'Success', value: 1 },
    { text: 'Retry', value: 2 },
    { text: 'Delete', value: 3 },
    { text: 'Recreate', value: 4 },
    { text: 'Delete database', value: 5 }
  ],
  validation: string()
    .trim()
    .required('Recover operation field is required')
    .default(() => 2)
}

export const FIELDS = [OPERATION]

export const SCHEMA = object(getValidationFromFields(FIELDS))
