import * as yup from 'yup'
import { getValidationFromFields, schemaUserInput } from 'client/utils'

export const FORM_FIELDS = inputs =>
  inputs?.map(({
    name,
    description,
    type,
    default: defaultValue,
    min_value: min,
    max_value: max,
    options
  }) => {
    const optionsValue = options?.join(',') ?? `${min}..${max}`

    return {
      name,
      label: `${description ?? name} *`,
      ...schemaUserInput({
        mandatory: true,
        name,
        type,
        options: optionsValue,
        defaultValue
      })
    }
  })

export const STEP_FORM_SCHEMA = inputs => yup.object(
  getValidationFromFields(FORM_FIELDS(inputs))
)
