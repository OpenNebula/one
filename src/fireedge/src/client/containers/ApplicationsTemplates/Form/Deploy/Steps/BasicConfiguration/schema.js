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

const NAME = {
  name: 'name',
  label: 'Application name',
  type: INPUT_TYPES.TEXT,
  validation: yup
    .string()
    .trim()
    .default(() => undefined),
}

const INSTANCES = {
  name: 'instances',
  label: 'Number of instances',
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: yup
    .number()
    .min(1, 'Instances minimum is 1')
    .integer('Instances should be an integer number')
    .required('Instances field is required')
    .default(1),
}

export const FORM_FIELDS = [NAME, INSTANCES]

export const STEP_FORM_SCHEMA = yup.object(getValidationFromFields(FORM_FIELDS))
