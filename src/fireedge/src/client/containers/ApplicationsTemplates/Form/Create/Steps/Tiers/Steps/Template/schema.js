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
import { getValidationFromFields } from 'client/utils'

export const FORM_FIELDS = [
  {
    name: 'id',
    validation: yup.number().min(0, 'Invalid template'),
  },
  {
    name: 'app',
    validation: yup.number().min(0, 'Invalid market app template'),
  },
  {
    name: 'docker',
    validation: yup.string().trim(),
  },
]

export const STEP_FORM_SCHEMA = yup
  .object(getValidationFromFields(FORM_FIELDS))
  .required('Template is required')
  .default(undefined)
