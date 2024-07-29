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

const STRATEGIES_DEPLOY = [
  { text: 'None', value: 'none' },
  { text: 'Straight', value: 'straight' },
]

const SHUTDOWN_ACTIONS = [
  { text: 'None', value: 'none' },
  { text: 'Terminate', value: 'terminate' },
  { text: 'Terminate hard', value: 'terminate-hard' },
]

export const FORM_FIELDS = [
  {
    name: 'registration_time',
    type: INPUT_TYPES.TEXT,
    htmlType: INPUT_TYPES.HIDDEN,
    validation: yup.number().default(undefined),
  },
  {
    name: 'name',
    label: 'Name',
    type: INPUT_TYPES.TEXT,
    validation: yup
      .string()
      .min(1, 'Name field is required')
      .trim()
      .required('Name field is required')
      .default(''),
  },
  {
    name: 'description',
    label: 'Description',
    type: INPUT_TYPES.TEXT,
    multiline: true,
    validation: yup.string().trim().default(''),
  },
  {
    name: 'deployment',
    label: 'Select a strategy',
    type: INPUT_TYPES.AUTOCOMPLETE,
    optionsOnly: true,
    values: STRATEGIES_DEPLOY,
    validation: yup
      .string()
      .trim()
      .required('Strategy deployment field is required')
      .oneOf(STRATEGIES_DEPLOY.map(({ value }) => value))
      .default(STRATEGIES_DEPLOY[1].value),
  },
  {
    name: 'shutdown_action',
    label: 'Select a VM shutdown action',
    type: INPUT_TYPES.AUTOCOMPLETE,
    optionsOnly: true,
    values: SHUTDOWN_ACTIONS,
    validation: yup
      .string()
      .oneOf(SHUTDOWN_ACTIONS.map(({ value }) => value))
      .default(SHUTDOWN_ACTIONS[0].value),
  },
  {
    name: 'ready_status_gate',
    label: 'Wait for Tier Full Boot',
    tooltip:
      'Wait for VM/containers to finish their boot process to report that they are READY and allow children tiers to spawn',
    type: INPUT_TYPES.CHECKBOX,
    validation: yup.boolean().default(false),
  },
  {
    name: 'automatic_deletion',
    label: 'Automatic delete service if all tiers are terminated',
    type: INPUT_TYPES.CHECKBOX,
    validation: yup.boolean().default(false),
  },
]

export const STEP_FORM_SCHEMA = yup.object(getValidationFromFields(FORM_FIELDS))
