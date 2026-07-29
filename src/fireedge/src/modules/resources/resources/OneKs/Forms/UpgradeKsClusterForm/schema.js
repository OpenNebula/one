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

import { BaseSchema, string } from 'yup'

import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field, arrayToOptions, getObjectSchemaFromFields } from '@UtilsModule'

/**
 * @param {object} root0 - Field options
 * @param {string[]} root0.versions - Supported Kubernetes versions
 * @returns {Field} Kubernetes version field
 */
const kubernetesVersionField = ({ versions = [] } = {}) => ({
  name: 'kubernetes_version',
  label: T.KubernetesVersion,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: () =>
    arrayToOptions(versions, {
      addEmpty: false,
      getText: (version) => version,
      getValue: (version) => version,
    }),
  validation: string().trim().required(),
  grid: { md: 12 },
})

/**
 * @param {object} props - Form options
 * @returns {Field[]} Upgrade form fields
 */
export const FIELDS = (props) => [kubernetesVersionField(props)]

/**
 * @param {object} props - Form options
 * @returns {BaseSchema} Upgrade form schema
 */
export const SCHEMA = (props) => getObjectSchemaFromFields(FIELDS(props))
