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
import ExtraConfiguration, {
  STEP_ID as EXTRA_ID,
} from 'client/components/Forms/VNTemplate/InstantiateForm/Steps/ExtraConfiguration'
import General, {
  STEP_ID as GENERAL_ID,
} from 'client/components/Forms/VNTemplate/InstantiateForm/Steps/General'
import { jsonToXml } from 'client/models/Helper'
import { createSteps } from 'client/utils'
import { ObjectSchema, reach } from 'yup'

const DYNAMIC_FIELDS = ['AR']

const existsOnSchema = (schema, key) => {
  try {
    return reach(schema, key) && true
  } catch (e) {
    return false
  }
}

/**
 * @param {object} fromAttributes - Attributes to check
 * @param {ObjectSchema} schema - Current form schema
 * @returns {object} List of unknown attributes
 */
export const getUnknownVars = (fromAttributes = {}, schema) => {
  const unknown = {}

  for (const [key, value] of Object.entries(fromAttributes)) {
    if (
      !!value &&
      !DYNAMIC_FIELDS.includes(key) &&
      !existsOnSchema(schema, `${GENERAL_ID}.${key}`) &&
      !existsOnSchema(schema, `${EXTRA_ID}.${key}`)
    ) {
      // When the path is not found, it means that
      // the attribute is correct and we can set it
      unknown[key] = value
    }
  }

  return unknown
}

const Steps = createSteps(() => [General, ExtraConfiguration].filter(Boolean), {
  transformInitialValue: (vmTemplate, schema) => {
    const initialValue = schema.cast(
      {
        [GENERAL_ID]: vmTemplate?.TEMPLATE,
        [EXTRA_ID]: vmTemplate?.TEMPLATE,
      },
      { stripUnknown: true }
    )

    return initialValue
  },
  transformBeforeSubmit: (formData, vnTemplate) => {
    const { [GENERAL_ID]: { name } = {}, [EXTRA_ID]: extraTemplate = {} } =
      formData ?? {}

    Array.isArray(extraTemplate?.SECURITY_GROUPS) &&
      extraTemplate?.SECURITY_GROUPS?.length &&
      (extraTemplate.SECURITY_GROUPS = extraTemplate.SECURITY_GROUPS.join(','))

    const templateXML = jsonToXml({
      ...extraTemplate,
    })

    const templates = {
      id: vnTemplate.ID,
      name,
      template: templateXML,
    }

    return templates
  },
})

export default Steps
