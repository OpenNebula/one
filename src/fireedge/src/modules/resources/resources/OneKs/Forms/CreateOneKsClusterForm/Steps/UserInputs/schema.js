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
import { ObjectSchema, object } from 'yup'
import { getObjectSchemaFromFields } from '@UtilsModule'
import { find } from 'lodash'

const generateSchema = (form, families) => {
  const familyConf = find(families, {
    family: form?.family?.FAMILY ?? 'general',
  })

  const schema = familyConf?.fields?.[form?.flavours?.FLAVOUR]
    ? getObjectSchemaFromFields(familyConf.fields[form.flavours.FLAVOUR])
    : undefined

  return schema || object()
}

/**
 * @param {Array} families - Step families
 * @returns {ObjectSchema} User inputs schema
 */
export const SCHEMA = (families) => (form) => generateSchema(form, families)
