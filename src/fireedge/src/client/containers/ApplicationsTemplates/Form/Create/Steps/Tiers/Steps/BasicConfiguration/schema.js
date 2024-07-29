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

const SHUTDOWN_ACTIONS = [
  { text: 'None', value: 'none' },
  { text: 'Shutdown', value: 'shutdown' },
  { text: 'Shutdown hard', value: 'shutdown-hard' },
]

const NAME = {
  name: 'name',
  label: 'Name',
  type: INPUT_TYPES.TEXT,
  validation: yup
    .string()
    .trim()
    .matches(/^\w+$/g, { message: 'Invalid characters' })
    .required('Name field is required')
    .default(''),
}

const CARDINALITY = {
  name: 'cardinality',
  label: 'Cardinality',
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: yup
    .number()
    .min(1, 'Cardinality field is required')
    .required('Cardinality field is required')
    .default(1),
}

const SHUTDOWN_ACTION = {
  name: 'shutdown_action',
  label: 'Select a VM shutdown action',
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: SHUTDOWN_ACTIONS,
  validation: yup
    .string()
    .notRequired()
    .oneOf(SHUTDOWN_ACTIONS.map(({ value }) => value))
    .default(SHUTDOWN_ACTIONS[0].value),
}

export const FORM_FIELDS = [NAME, CARDINALITY, SHUTDOWN_ACTION]

export const STEP_FORM_SCHEMA = yup.object(getValidationFromFields(FORM_FIELDS))
