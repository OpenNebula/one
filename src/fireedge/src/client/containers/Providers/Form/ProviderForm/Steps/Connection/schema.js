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
import { getValidationFromFields, isBase64, prettyBytes } from 'client/utils'

const MAX_SIZE_JSON = 102_400
const JSON_FORMAT = 'application/json'
const CREDENTIAL_INPUT = 'credentials'

export const FORM_FIELDS = ({ connection, fileCredentials }) =>
  Object.entries(connection)?.map(([name, label]) => {
    const isInputFile = fileCredentials && String(name).toLowerCase() === CREDENTIAL_INPUT

    let validation = yup
      .string()
      .trim()
      .required(`${name} field is required`)
      .default(undefined)

    if (isInputFile) {
      validation = validation.test('is-base64', 'File has invalid format', isBase64)
    }

    return {
      name,
      label,
      type: isInputFile ? INPUT_TYPES.FILE : INPUT_TYPES.PASSWORD,
      validation,
      ...(isInputFile && {
        fieldProps: { accept: JSON_FORMAT },
        validationBeforeTransform: [{
          message: `Only the following formats are accepted: ${JSON_FORMAT}`,
          test: value => value?.type !== JSON_FORMAT
        }, {
          message: `The file is too large. Max ${prettyBytes(MAX_SIZE_JSON, '')}`,
          test: value => value?.size > MAX_SIZE_JSON
        }],
        transform: async file => {
          const json = await new Response(file ?? '{}').json()
          return btoa(JSON.stringify(json))
        }
      })
    }
  })

export const STEP_FORM_SCHEMA = props => yup.object(
  getValidationFromFields(FORM_FIELDS(props))
)
