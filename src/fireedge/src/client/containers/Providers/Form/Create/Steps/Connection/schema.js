import * as yup from 'yup'
import { INPUT_TYPES, CREDENTIALS_FILE } from 'client/constants'
import { getValidationFromFields, isBase64, prettyBytes } from 'client/utils'

const MAX_SIZE_JSON = 102_400
const JSON_FORMAT = 'application/json'

export const FORM_FIELDS = ({ connection, providerType }) =>
  Object.entries(connection)?.map(([name, label]) => {
    const isInputFile = CREDENTIALS_FILE[providerType] === String(name).toLowerCase()

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
          const json = await new Response(file).json()
          return btoa(JSON.stringify(json))
        }
      })
    }
  })

export const STEP_FORM_SCHEMA = props => yup.object(
  getValidationFromFields(FORM_FIELDS(props))
)
