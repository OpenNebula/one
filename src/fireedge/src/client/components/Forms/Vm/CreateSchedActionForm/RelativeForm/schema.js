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
import * as yup from 'yup'

import { INPUT_TYPES } from 'client/constants'
import { getValidationFromFields, capitalize } from 'client/utils'
import { COMMON_FIELDS, COMMON_SCHEMA } from 'client/components/Forms/Vm/CreateSchedActionForm/CommonSchema'

const PERIOD_TYPES = {
  YEARS: 'years',
  MONTHS: 'months',
  WEEKS: 'weeks',
  DAYS: 'days',
  HOURS: 'hours',
  MINUTES: 'minutes'
}

const PERIOD_OPTIONS = Object.entries(PERIOD_TYPES)
  .map(([text, value]) => ({ text: capitalize(text), value }))

const TIME_FIELD = {
  name: 'TIME',
  label: 'Time after the VM is instantiated',
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: yup
    .number()
    .typeError('Time value must be a number')
    .required('Time field is required')
    .positive()
    .default(undefined)
}

const PERIOD_FIELD = {
  name: 'PERIOD',
  label: 'Period type',
  type: INPUT_TYPES.SELECT,
  values: PERIOD_OPTIONS,
  validation: yup
    .string()
    .trim()
    .notRequired()
    .default(PERIOD_OPTIONS[0].value)
}

export const FIELDS = vm => [
  ...COMMON_FIELDS(vm),
  TIME_FIELD,
  PERIOD_FIELD
]

export const SCHEMA = vm => yup
  .object(getValidationFromFields(FIELDS(vm)))
  .concat(COMMON_SCHEMA(vm))
  .transform(value => {
    const { [PERIOD_FIELD.name]: PERIOD, [TIME_FIELD.name]: TIME, ...rest } = value

    if (String(TIME).includes('+')) {
      const allPeriods = {
        [PERIOD_TYPES.YEARS]: TIME / 365 / 24 / 3600,
        [PERIOD_TYPES.MONTHS]: TIME / 30 / 24 / 3600,
        [PERIOD_TYPES.WEEKS]: TIME / 7 / 24 / 3600,
        [PERIOD_TYPES.DAYS]: TIME / 24 / 3600,
        [PERIOD_TYPES.HOURS]: TIME / 3600,
        [PERIOD_TYPES.MINUTES]: TIME / 60
      }

      const [period, time] = Object.entries(allPeriods).find(([_, time]) => time >= 1)

      return { ...rest, [PERIOD_FIELD.name]: period, [TIME_FIELD.name]: time }
    }

    const timeInMilliseconds = {
      [PERIOD_TYPES.YEARS]: TIME * 365 * 24 * 3600,
      [PERIOD_TYPES.MONTHS]: TIME * 30 * 24 * 3600,
      [PERIOD_TYPES.WEEKS]: TIME * 7 * 24 * 3600,
      [PERIOD_TYPES.DAYS]: TIME * 24 * 3600,
      [PERIOD_TYPES.HOURS]: TIME * 3600,
      [PERIOD_TYPES.MINUTES]: TIME * 60
    }[PERIOD]

    return { ...rest, [TIME_FIELD.name]: timeInMilliseconds }
  })
