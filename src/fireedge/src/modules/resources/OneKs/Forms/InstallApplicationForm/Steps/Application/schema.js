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
import { array, boolean, mixed, object, ObjectSchema, string } from 'yup'

import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field, getValidationFromFields } from '@UtilsModule'

/** @type {Field} Catalogue application selection */
const APPLICATION_ID = () => ({
  name: 'APPLICATION_ID',
  label: T.Application,
  type: INPUT_TYPES.HIDDEN,
  validation: string().trim().required(T.SelectApplication),
})

/** @type {Field} Loaded application definition */
const DEFINITION = () => ({
  name: 'DEFINITION',
  type: INPUT_TYPES.HIDDEN,
  validation: mixed().required(T.ApplicationDefinitionError),
})

/** @type {Field} Compatibility check reasons */
const REASONS = () => ({
  name: 'REASONS',
  type: INPUT_TYPES.HIDDEN,
  validation: array(string()).default(() => []),
})

/** @type {Field} Application compatibility status */
const INSTALLABLE = () => ({
  name: 'INSTALLABLE',
  type: INPUT_TYPES.HIDDEN,
  validation: boolean()
    .required(T.ApplicationInstallabilityPending)
    .test(
      'application-installable',
      T.ApplicationNotInstallable,
      function (value) {
        if (value === true) return true

        return this.createError({
          message:
            this.parent?.REASONS?.join('; ') || T.ApplicationNotInstallable,
        })
      }
    ),
})

/** @type {Field[]} List of application step fields */
export const FIELDS = () => [
  APPLICATION_ID(),
  DEFINITION(),
  REASONS(),
  INSTALLABLE(),
]

/** @type {ObjectSchema} Application step schema */
export const SCHEMA = () => object(getValidationFromFields(FIELDS()))
