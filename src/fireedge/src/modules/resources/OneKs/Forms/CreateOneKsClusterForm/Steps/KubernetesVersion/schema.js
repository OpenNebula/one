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
import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field, getObjectSchemaFromFields, arrayToOptions } from '@UtilsModule'
import { string, ObjectSchema } from 'yup'
import { find } from 'lodash'

/** @type {Field} kubernetes version field */
const KUBERNETES_VERSION = (families) => ({
  name: 'KUBERNETES_VERSION',
  label: T.KubernetesVersion,
  type: INPUT_TYPES.AUTOCOMPLETE,
  dependOf: '$family.FAMILY',
  optionsOnly: true,
  values: (selectedFamily = 'general') => {
    const family = find(families, { family: selectedFamily })
    const supportedVersions = family?.supported_k8s_versions || []

    return arrayToOptions(supportedVersions, {
      addEmpty: false,
      getText: (version) => version,
      getValue: (version) => version,
    })
  },
  validation: string().trim().required(),
  grid: { md: 12 },
})

/**
 * @param {Array} families - Step families
 * @returns {Field[]} Fields
 */
const FIELDS = (families) => [KUBERNETES_VERSION(families)]
/**
 * @param {Array} families - Step families
 * @returns {ObjectSchema} Advanced options schema
 */
const SCHEMA = (families) => getObjectSchemaFromFields(FIELDS(families))

export { SCHEMA, FIELDS }
