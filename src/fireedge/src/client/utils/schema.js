import * as yup from 'yup'
import { INPUT_TYPES } from 'client/constants'

const requiredSchema = (mandatory, name, schema) =>
  mandatory
    ? schema.required(`${name} field is required`)
    : schema.notRequired().nullable()

const getRange = (options) =>
  options.split('..').map(option => parseFloat(option))

const getValuesFromArray = (options, separator = ',') => options?.split(separator)

const getOptionsFromList = (options, separator = ',') =>
  options?.split(separator).map(value => ({ text: value, value }))

export const schemaUserInput = ({ mandatory, name, type, options, defaultValue }) => {
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
      const firstOption = values?.[0]?.value ?? undefined

      return {
        values,
        type: INPUT_TYPES.SELECT,
        validation: yup.string()
          .trim()
          .concat(requiredSchema(mandatory, name, yup.string()))
          .oneOf(values.map(({ value }) => value))
          .default(defaultValue ?? firstOption)
      }
    }
    case 'array': {
      const defaultValues = getValuesFromArray(defaultValue)

      return {
        type: INPUT_TYPES.AUTOCOMPLETE,
        multiple: true,
        validation: yup.array(yup.string().trim())
          .concat(requiredSchema(mandatory, name, yup.array()))
          .default(defaultValues),
        fieldProps: { freeSolo: true }
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

// Parser USER INPUTS

const parseUserInputValue = value => {
  if (value === true) {
    return 'YES'
  } if (value === false) {
    return 'NO'
  } else if (Array.isArray(value)) {
    return value.join(',')
  } else return value
}

export const mapUserInputs = userInputs =>
  Object.entries(userInputs)?.reduce((res, [key, value]) => ({
    ...res, [key]: parseUserInputValue(value)
  }), {})
