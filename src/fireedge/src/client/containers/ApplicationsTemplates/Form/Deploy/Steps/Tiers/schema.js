import * as yup from 'yup'
import { v4 as uuidv4 } from 'uuid'

import { INPUT_TYPES } from 'client/constants'
import { getValidationFromFields } from 'client/utils/helpers'
import { parseFloat } from 'window-or-global'

export const ID = {
  name: 'id',
  label: 'ID',
  type: INPUT_TYPES.TEXT,
  htmlType: INPUT_TYPES.HIDDEN,
  validation: yup
    .string()
    .trim()
    .uuid()
    .required()
    .default(uuidv4)
}

const requiredSchema = (mandatory, name, schema) =>
  mandatory
    ? schema.required(`${name} field is required`)
    : schema.notRequired().nullable()

const getRange = (options) =>
  options.split('..').map(option => parseFloat(option))

const getOptionsFromList = (options, separator = ',') =>
  options?.split(separator).map(value => ({ text: value, value }))

const getUserInput = ({ mandatory, name, type, options, defaultValue }) => {
  switch (type) {
    case 'text':
    case 'text64':
    case 'password': return {
      type: INPUT_TYPES.TEXT,
      htmlType: type === 'password' ? 'password' : 'text',
      validation: yup.string()
        .trim()
        .concat(requiredSchema(mandatory, name, yup.string()))
        .default(defaultValue || undefined)
    }
    case 'number':
    case 'number-float': return {
      type: INPUT_TYPES.TEXT,
      htmlType: 'number',
      validation: yup.number()
        .typeError(`${name} must be a number`)
        .concat(requiredSchema(mandatory, name, yup.number()))
        .transform(value => !isNaN(value) ? value : null)
        .default(() => parseFloat(defaultValue) ?? undefined)
    }
    case 'range':
    case 'range-float': {
      const [min, max] = getRange(options)

      return {
        type: INPUT_TYPES.SLIDER,
        validation: yup.number()
          .typeError(`${name} must be a number`)
          .concat(requiredSchema(mandatory, name, yup.number()))
          .min(min, `${name} must be greater than or equal to ${min}`)
          .max(max, `${name} must be less than or equal to ${max}`)
          .transform(value => !isNaN(value) ? value : undefined)
          .default(parseFloat(defaultValue) ?? undefined),
        fieldProps: { min, max, step: type === 'range-float' ? 0.01 : 1 }
      }
    }
    case 'boolean': return {
      type: INPUT_TYPES.CHECKBOX,
      validation: yup.boolean()
        .concat(requiredSchema(mandatory, name, yup.boolean()))
        .default(defaultValue === 'YES' ?? false)
    }
    case 'list': {
      const values = getOptionsFromList(options)

      return {
        values,
        type: INPUT_TYPES.SELECT,
        validation: yup.string()
          .trim()
          .concat(requiredSchema(mandatory, name, yup.string()))
          .oneOf(values.map(({ value }) => value))
          .default(defaultValue ?? undefined)
      }
    }
    case 'list-multiple': {
      const values = getOptionsFromList(options)
      const defaultValues = defaultValue?.split(',') ?? undefined

      return {
        values,
        type: INPUT_TYPES.SELECT,
        multiple: true,
        validation: yup.array(yup.string().trim())
          .concat(requiredSchema(mandatory, name, yup.array()))
          .default(defaultValues)
      }
    }
    default: return {
      type: INPUT_TYPES.TEXT,
      validation: yup.string()
        .trim()
        .concat(requiredSchema(mandatory, name, yup.string()))
        .default(defaultValue || undefined)
    }
  }
}

export const FORM_FIELDS = userInputs =>
  Object.entries(userInputs)?.map(([name, values]) => {
    const input = String(values).split('|')
    // 0 mandatory; 1 type; 2 description; 3 range/options; 4 defaultValue;
    const mandatory = input[0] === 'M'
    const type = input[1]
    const description = input[2]
    const options = input[3]
    const defaultValue = input[4]

    return {
      name,
      label: `${description}${mandatory ? '  *' : ''}`,
      ...getUserInput({ mandatory, name, type, options, defaultValue })
    }
  })

export const USER_INPUTS_FORM_SCHEMA = userInputs => yup.object(
  getValidationFromFields(FORM_FIELDS(userInputs))
)

export const STEP_FORM_SCHEMA = ({ tiers, vmTemplates }) => {
  const schemasUI = tiers?.reduce((schemas, tier) => {
    const { id: tierId, template: { id } } = tier
    const vmTemplate = vmTemplates?.find(({ ID }) => id === ID) ?? {}

    const { TEMPLATE: { USER_INPUTS = {} } = {} } = vmTemplate

    return { ...schemas, [tierId]: USER_INPUTS_FORM_SCHEMA(USER_INPUTS) }
  }, {})

  return yup
    .array(yup.lazy(value => yup.object({
      ...getValidationFromFields([ID]),
      user_inputs_values: schemasUI[value?.id]
    })))
    .min(1, 'Should be at least one tier')
    .required('Tiers field is required')
    .default(() => tiers.map((tier) => ({
      ...tier, user_inputs_values: schemasUI[tier.id].default()
    })))
}
