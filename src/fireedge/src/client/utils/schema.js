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
/* eslint-disable jsdoc/valid-types */

// eslint-disable-next-line no-unused-vars
import { JSXElementConstructor, SetStateAction } from 'react'
// eslint-disable-next-line no-unused-vars
import { GridProps, TextFieldProps, CheckboxProps, InputBaseComponentProps } from '@mui/material'
import { string, number, boolean, array, object, BaseSchema } from 'yup'

import { INPUT_TYPES } from 'client/constants'

// ----------------------------------------------------------
// Types
// ----------------------------------------------------------

/**
 * @typedef {object} ValidateOptions
 * @property {boolean} [strict]
 * - Only validate the input, and skip and coercion or transformation.
 * Default - `false`
 * @property {boolean} [abortEarly]
 * - Return from validation methods on the first error rather than after all validations run.
 * Default - `true`
 * @property {boolean} [stripUnknown]
 * - Remove unspecified keys from objects.
 * Default - `false`
 * @property {boolean} [recursive]
 * - When `false` validations will not descend into nested schema (relevant for objects or arrays).
 * Default - `true`
 * @property {object} [context]
 * - Any context needed for validating schema conditions
 */

/**
 * Callback of field parameter when depend of another field.
 *
 * @callback DependOfCallback
 * @param {any|any[]} value - Value
 * @returns {any|any[]}
 */

/**
 * @typedef {object} SelectOption - Option of select field
 * @property {string|JSXElementConstructor} text - Text to display on select list
 * @property {any} value - Value to option
 */

/**
 * @typedef {object} Field
 * @property {string|DependOfCallback} name
 * - Path name in the form
 * - IMPORTANT: Name is required and unique
 * (can not start with a number or use number as key name)
 * Name also supports dot and bracket syntax.
 * - For example: 'firstName', 'person.firstName' or 'person[0].firstName'
 * @property {string|string[]} dependOf
 * - Path names of other fields on the form.
 * Can be used by the rest of the properties, receiving it by function parameters
 * @property {string|DependOfCallback} label
 * - Label of field
 * @property {string|DependOfCallback} [tooltip]
 * - Text description
 * @property {INPUT_TYPES|DependOfCallback} type
 * - Field type to draw: text, select, autocomplete, etc
 * @property {string|DependOfCallback} [htmlType]
 * - Type of the input element. It should be a valid HTML5 input type
 * @property {function(any|any[]):any} [watcher]
 * - Function to watch other values
 * @property {SelectOption[]|DependOfCallback} [values]
 * - Type of the input element. It should be a valid HTML5 input type
 * @property {boolean|DependOfCallback} [multiline]
 * - If `true`, a textarea element will be rendered instead of an input
 * @property {GridProps|DependOfCallback} [grid]
 * - Grid properties to override in the wrapper element
 * - Default: { xs: 12, md: 6 }
 * @property {BaseSchema|DependOfCallback} [validation]
 * - Schema to validate the field value
 * @property {TextFieldProps|CheckboxProps|InputBaseComponentProps} [fieldProps]
 * - Extra properties to material field
 * @property {{message: string, test: Function}[]|DependOfCallback} [validationBeforeTransform]
 * - Tests to validate the field value.
 * - **Only for file inputs.**
 * @property {Function|DependOfCallback} [transform]
 * - Transform the file value.
 * - For example: to save file as string value in base64 format.
 * - **Only for file inputs.**
 */

/**
 * @typedef {object} Form
 * @property {BaseSchema|function(object):BaseSchema} resolver - Schema
 * @property {Field[]|function(object):Field[]} fields - Fields to draw at form
 * @property {object} defaultValues - Default values
 */

/**
 * @typedef {object} Step
 * @property {string} id - Id
 * @property {string} label - Label
 * @property {BaseSchema|function(object):BaseSchema} resolver - Schema
 * @property {function(object, SetStateAction):JSXElementConstructor} content - Content
 * @property {ValidateOptions|undefined} optionsValidate - Validate options
 */

/**
 * @typedef {object} StepsForm
 * @property {Step[]} steps - Steps
 * @property {BaseSchema|function():BaseSchema} resolver - Schema
 * @property {object} defaultValues - Default values
 */

/**
 * @typedef {object} ExtraParams
 * @property {function(object):object} [transformBeforeSubmit] - Transform validated form data after submit
 * @property {function(object, BaseSchema):object} [transformInitialValue] - Transform initial value after load form
 */

/**
 * @callback StepComponent
 * @param {object} stepProps - Properties passes to all Step functions
 * @returns {function(object):Step}
 */

/**
 * @callback CreateStepsCallback
 * @param {object} stepProps - Properties passes to all Step functions
 * @param {object} initialValues - Initial values to form
 * @returns {StepsForm & ExtraParams}
 */

/**
 * @callback CreateFormCallback
 * @param {object} props - Properties passes to schema and field
 * @param {object} initialValues - Initial values to form
 * @returns {Form & ExtraParams}
 */

/**
 * @typedef {('text'|'text64'|'password'|'number'|'number-float'|'range'|
 * 'range-float'|'boolean'|'list'|'array'|'list-multiple')} UserInputType
 * - OpenNebula types for user inputs
 */

// ----------------------------------------------------------
// Constants
// ----------------------------------------------------------

const requiredSchema = (mandatory, name, schema) =>
  mandatory
    ? schema.required(`${name} field is required`)
    : schema.notRequired().nullable()

const getRange = options => options?.split('..').map(option => parseFloat(option))

const getValuesFromArray = (options, separator = ';') => options?.split(separator)

const getOptionsFromList = options => options
  ?.map(option => typeof option === 'string'
    ? ({ text: option, value: option })
    : option
  )
  ?.filter(({ text, value } = {}) => text && value)

const parseUserInputValue = value => {
  if (value === true) {
    return 'YES'
  } else if (value === false) {
    return 'NO'
  } else if (Array.isArray(value)) {
    return value.join(',')
  } else return value
}

// ----------------------------------------------------------
// Function (to export)
// ----------------------------------------------------------

/**
 * Get input schema for the user input defined in OpenNebula resource.
 *
 * @param {object} userInput - User input from OpenNebula document
 * @param {boolean} userInput.mandatory - If `true`, the input will be required
 * @param {string} userInput.name - Name of input
 * @param {UserInputType} userInput.type - Input type
 * @param {string} [userInput.options] - Options available for the input
 * @param {number|string|string[]} [userInput.defaultValue] - Default value for the input
 * @returns {Field} Field properties
 */
export const schemaUserInput = ({ mandatory, name, type, options, defaultValue }) => {
  switch (type) {
    case 'text':
    case 'text64':
    case 'password': return {
      type: INPUT_TYPES.TEXT,
      htmlType: type === 'password' ? 'password' : 'text',
      validation: string()
        .trim()
        .concat(requiredSchema(mandatory, name, string()))
        .default(defaultValue || undefined)
    }
    case 'number':
    case 'number-float': return {
      type: INPUT_TYPES.TEXT,
      htmlType: 'number',
      validation: number()
        .typeError(`${name} must be a number`)
        .concat(requiredSchema(mandatory, name, number()))
        .transform(value => !isNaN(value) ? value : null)
        .default(() => parseFloat(defaultValue) ?? undefined)
    }
    case 'range':
    case 'range-float': {
      const [min, max] = getRange(options)

      return {
        type: INPUT_TYPES.SLIDER,
        validation: number()
          .typeError(`${name} must be a number`)
          .concat(requiredSchema(mandatory, name, number()))
          .min(min, `${name} must be greater than or equal to ${min}`)
          .max(max, `${name} must be less than or equal to ${max}`)
          .transform(value => !isNaN(value) ? value : undefined)
          .default(parseFloat(defaultValue) ?? undefined),
        fieldProps: { min, max, step: type === 'range-float' ? 0.01 : 1 }
      }
    }
    case 'boolean': return {
      type: INPUT_TYPES.CHECKBOX,
      validation: boolean()
        .concat(requiredSchema(mandatory, name, boolean()))
        .default(defaultValue === 'YES' ?? false)
    }
    case 'list': {
      const values = getOptionsFromList(options)
      const firstOption = values?.[0]?.value ?? undefined

      return {
        values,
        type: INPUT_TYPES.SELECT,
        validation: string()
          .trim()
          .concat(requiredSchema(mandatory, name, string()))
          .oneOf(values.map(({ value }) => value))
          .default(defaultValue || firstOption)
      }
    }
    case 'array': {
      const defaultValues = getValuesFromArray(defaultValue)

      return {
        type: INPUT_TYPES.AUTOCOMPLETE,
        multiple: true,
        validation: array(string().trim())
          .concat(requiredSchema(mandatory, name, array()))
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
        validation: array(string().trim())
          .concat(requiredSchema(mandatory, name, array()))
          .default(defaultValues)
      }
    }
    default: return {
      type: INPUT_TYPES.TEXT,
      validation: string()
        .trim()
        .concat(requiredSchema(mandatory, name, string()))
        .default(defaultValue || undefined)
    }
  }
}

/**
 * Parse JS values to OpenNebula values.
 *
 * @param {object} userInputs - List of user inputs
 * @example <caption>Example of parsed</caption>
 * // { user_ssh: true } => { user_ssh: 'YES' }
 * // { groups: [1, 2, 3] } => { groups: '1,2,3' }
 * @returns {object} - Returns same object with values can be operated by OpenNebula
 */
export const mapUserInputs = (userInputs = {}) =>
  Object.entries(userInputs)?.reduce((res, [key, value]) => ({
    ...res, [key]: parseUserInputValue(value)
  }), {})

/**
 * Converts a list of values to usable options.
 *
 * @param {any[]} array - List of option values
 * @param {object} [options] - Options to conversion
 * @param {boolean} [options.addEmpty] - If `true`, add an empty option
 * @param {function(any):any} [options.getText] - Function to get the text option
 * @param {function(any):any} [options.getValue] - Function to get the value option
 * @returns {SelectOption} Options
 */
export const arrayToOptions = (array = [], options = {}) => {
  const { addEmpty = true, getText = o => o, getValue = o => o } = options

  const values = array.map(item => ({ text: getText(item), value: getValue(item) }))

  addEmpty && values.unshift({ text: '-', value: '' })

  return values
}

/**
 * Sanitizes the names from object.
 *
 * @param {string|string[]} names - List of names
 * @returns {string|string[]} Sanitized names
 * @example 'TEST.NAME' => 'NAME'
 */
export const clearNames = (names = '') =>
  Array.isArray(names) ? names.map(clearNames) : names.split(/[,[\].]+?/).at(-1)

/**
 * Returns parameters needed to create stepper form.
 *
 * @param {StepComponent[]|function(object):StepComponent[]} steps - Step functions list or function to get it
 * @param {ExtraParams} [extraParams] - Extra parameters
 * @returns {CreateStepsCallback} Function to get steps
 */
export const createSteps = (steps, extraParams = {}) =>
  (stepProps = {}, initialValues) => {
    const { transformInitialValue = () => initialValues } = extraParams

    const stepCallbacks = typeof steps === 'function' ? steps(stepProps) : steps
    const performedSteps = stepCallbacks.map(step => step(stepProps))

    const schemas = {}
    for (const { id, resolver } of performedSteps) {
      const schema = typeof resolver === 'function' ? resolver() : resolver

      schemas[id] = schema
    }

    const allResolver = object(schemas)

    const defaultValues = initialValues
      ? transformInitialValue(initialValues, allResolver)
      : allResolver.default()

    return {
      steps: performedSteps,
      defaultValues,
      resolver: () => allResolver,
      ...extraParams
    }
  }

/**
 * Returns parameters needed to create a form.
 *
 * @param {BaseSchema|function(object):BaseSchema} schema - Schema to validate the form
 * @param {Field[]|function(object):Field[]} fields - Fields to draw in the form
 * @param {ExtraParams} [extraParams] - Extra parameters
 * @returns {CreateFormCallback} Function to get form parameters
 */
export const createForm = (schema, fields, extraParams = {}) =>
  (props = {}, initialValues) => {
    const schemaCallback = typeof schema === 'function' ? schema(props) : schema
    const fieldsCallback = typeof fields === 'function' ? fields(props) : fields

    const defaultTransformInitialValue = (values, schema) =>
      schema.cast(values, { stripUnknown: true })

    const { transformInitialValue = defaultTransformInitialValue } = extraParams

    const defaultValues = initialValues
      ? transformInitialValue(initialValues, schemaCallback)
      : schemaCallback.default()

    return {
      resolver: () => schemaCallback,
      fields: () => fieldsCallback,
      defaultValues,
      ...extraParams
    }
  }
