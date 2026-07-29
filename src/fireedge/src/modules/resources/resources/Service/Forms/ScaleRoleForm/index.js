/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { boolean, number, object } from 'yup'

import { INPUT_TYPES, T } from '@ConstantsModule'
import { createForm, getValidationFromFields } from '@UtilsModule'

const FIELDS = [
  {
    name: 'cardinality',
    label: T.NumberOfVms,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    validation: number()
      .transform((value, originalValue) =>
        originalValue === '' || originalValue === null ? undefined : value
      )
      .integer()
      .min(0)
      .required()
      .default(() => undefined),
    grid: { xs: 12 },
  },
  {
    name: 'force',
    label: T.Force,
    type: INPUT_TYPES.SWITCH,
    validation: boolean().default(() => false),
    grid: { xs: 12 },
  },
]

const SCHEMA = object(getValidationFromFields(FIELDS))

const ScaleRoleForm = createForm(SCHEMA, FIELDS, {
  transformBeforeSubmit: (
    { cardinality, force } = {},
    _,
    { roleName } = {}
  ) => ({
    action: {
      force: !!force,
      cardinality,
      role_name: roleName,
    },
  }),
})

export default ScaleRoleForm
