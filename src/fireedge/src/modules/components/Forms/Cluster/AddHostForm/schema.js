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
import { array, lazy, object, ObjectSchema, string } from 'yup'

import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field, getValidationFromFields } from '@UtilsModule'

/** @type {Field} Host field */
const HOSTS = ({ formType = '', filter }) => {
  if (formType === 'amount') {
    return {
      name: 'hosts',
      label: T.NumberOfHostsToAdd,
      type: INPUT_TYPES.TEXT,
      htmlType: 'number',
      fieldProps: { min: 1 },
      grid: { md: 12 },
      validation: string()
        .trim()
        .required()
        .default(() => 1),
    }
  } else {
    return {
      name: 'hosts',
      label: T.SelectNewHostsToAdd,
      type: INPUT_TYPES.AUTOCOMPLETE,
      tooltip: [T.PressKeysToAddAHost, ['ENTER']],
      multiple: true,
      fieldProps: {
        freeSolo: true,
      },
      grid: { md: 12 },
      validation: lazy(() =>
        array(string().trim())
          .required()
          .default(() => undefined)
      ),
    }
  }
}

/** @type {Field[]} List of fields */
export const FIELDS = (params) => [HOSTS(params)]

/** @type {ObjectSchema} Schema */
export const SCHEMA = (params) =>
  object(getValidationFromFields(FIELDS(params)))
