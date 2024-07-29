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
/* eslint-disable jsdoc/valid-types */

// eslint-disable-next-line no-unused-vars
import { ReactElement, SetStateAction } from 'react'

import {
  // eslint-disable-next-line no-unused-vars
  CheckboxProps,
  // eslint-disable-next-line no-unused-vars
  GridProps,
  // eslint-disable-next-line no-unused-vars
  InputBaseComponentProps,
  // eslint-disable-next-line no-unused-vars
  TextFieldProps,
} from '@mui/material'
import { BaseSchema, array, boolean, number, object, string } from 'yup'
// eslint-disable-next-line no-unused-vars
import { Row } from 'react-table'

import {
  // eslint-disable-next-line no-unused-vars
  HYPERVISORS,
  INPUT_TYPES,
  RESTRICTED_ATTRIBUTES_TYPE,
  T,
  USER_INPUT_TYPES,
  UserInputObject,
  // eslint-disable-next-line no-unused-vars
  VN_DRIVERS,
} from 'client/constants'
import { stringToBoolean } from 'client/models/Helper'

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
 * @property {string|ReactElement} text - Text to display on select list
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
 * @property {HYPERVISORS[]|DependOfCallback} [notOnHypervisors]
 * - Filters the field when the hypervisor is not include on list
 * @property {VN_DRIVERS[]|DependOfCallback} [notOnDrivers]
 * - Filters the field when the driver is not include on list
 * @property {TextFieldProps|CheckboxProps|InputBaseComponentProps} [fieldProps]
 * - Extra properties to material-ui field
 * @property {boolean|DependOfCallback} [readOnly]
 * - If `true`, the field is read only
 * @property {function(string|number):any} [renderValue]
 * - Render the current selected value inside selector input
 * - **Only for select inputs.**
 * @property {ReactElement} [Table]
 * - Table component. One of table defined in: `client/components/Tables`
 * - **Only for table inputs.**
 * @property {boolean|DependOfCallback} [singleSelect]
 * If `true`, the table component only will allows to select one row
 * - **Only for table inputs.**
 * @property {function(Row, number):string} [getRowId]
 * This function changes how React Table detects unique rows
 * and also how it constructs each row's underlying id property.
 * - **Only for table inputs.**
 * @property {{message: string, test: Function}[]|DependOfCallback} [validationBeforeTransform]
 * - Tests to validate the field value.
 * - **Only for file inputs.**
 * @property {Function} [transform]
 * - Transform the file value.
 * - For example: to save file as string value in base64 format.
 * - **Only for file inputs.**
 */

/**
 * @typedef {object} Section
 * @property {string} id - Section id
 * @property {string} legend - Legend text
 * @property {string} legendTooltip - Legend tooltip
 * @property {Field[]} fields - The Fields will be includes on section
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
 * @property {function(object, SetStateAction):ReactElement} content - Content
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
 * @property {ReactElement} [ContentForm] - Render content of form
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

// ----------------------------------------------------------
// Constants
// ----------------------------------------------------------

/** @enum {Function} Sorters */
export const OPTION_SORTERS = {
  default: (a, b) => `${a.value}`.localeCompare(`${b.value}`),
  numeric: (a, b) =>
    `${a.value}`.localeCompare(`${b.value}`, undefined, {
      numeric: true,
      ignorePunctuation: true,
    }),
  unsort: () => null,
}

const SEMICOLON_CHAR = ';'

const requiredSchema = (mandatory, schema) =>
  mandatory ? schema.required() : schema.notRequired().nullable()

const getRange = (options) => options?.split?.('..').map(parseFloat)

const getValuesFromArray = (options, separator = SEMICOLON_CHAR) =>
  options?.split(separator)

const getOptionsFromList = (options = [], sorter) => {
  const config = { addEmpty: false }
  sorter && (config.sorter = sorter)

  return arrayToOptions([...new Set(options)], config)
}

const parseUserInputValue = (value) => {
  if (value === true) {
    return 'YES'
  } else if (value === false) {
    return 'NO'
  } else if (
    Array.isArray(value) &&
    value.every((v) => typeof v === 'string')
  ) {
    return value.join(',')
  } else return value
}

// ----------------------------------------------------------
// Function (to export)
// ----------------------------------------------------------

/**
 * Get field properties to represent an user input defined by OpenNebula.
 *
 * @param {UserInputObject} userInput - User input from OpenNebula document
 * @returns {Field} Field properties
 */
export const schemaUserInput = ({
  mandatory,
  type,
  min,
  max,
  options,
  default: defaultValue,
  sorter,
}) => {
  switch (type) {
    case USER_INPUT_TYPES.fixed: {
      const isNumeric = !isNaN(defaultValue)
      const ensuredValue = isNumeric ? parseFloat(defaultValue) : defaultValue
      const validation = isNumeric ? number() : string().trim()

      return {
        type: INPUT_TYPES.TEXT,
        htmlType: isNaN(+defaultValue) ? 'text' : 'number',
        validation: validation
          .default(ensuredValue)
          // ensures to send the value
          .afterSubmit(() => defaultValue),
        fieldProps: { disabled: true },
        readOnly: true,
      }
    }
    case USER_INPUT_TYPES.text:
    case USER_INPUT_TYPES.text64:
    case USER_INPUT_TYPES.password:
      return {
        type: INPUT_TYPES.TEXT,
        htmlType: type === USER_INPUT_TYPES.password ? 'password' : 'text',
        validation: string()
          .trim()
          .concat(requiredSchema(mandatory, string()))
          .default(defaultValue || undefined),
      }
    case USER_INPUT_TYPES.number:
    case USER_INPUT_TYPES.numberFloat: {
      const ensuredValue = parseFloat(defaultValue)

      return {
        type: INPUT_TYPES.TEXT,
        htmlType: 'number',
        validation: number()
          .concat(requiredSchema(mandatory, number()))
          .transform((value) => (!isNaN(value) ? value : null))
          .default(isNaN(ensuredValue) ? undefined : ensuredValue),
      }
    }
    case USER_INPUT_TYPES.range:
    case USER_INPUT_TYPES.rangeFloat: {
      const [minimum, maximum] = getRange(options) ?? [min, max].map(parseFloat)
      const ensuredValue = parseFloat(defaultValue)

      return {
        type: INPUT_TYPES.SLIDER,
        validation: number()
          .concat(requiredSchema(mandatory, number()))
          .min(minimum)
          .max(maximum)
          .transform((value) => (!isNaN(value) ? value : undefined))
          .default(isNaN(ensuredValue) ? undefined : ensuredValue),
        fieldProps: {
          min: minimum,
          max: maximum,
          step: type === USER_INPUT_TYPES.rangeFloat ? 0.1 : 1,
        },
      }
    }
    case USER_INPUT_TYPES.boolean:
      return {
        type: INPUT_TYPES.CHECKBOX,
        validation: boolean()
          .concat(requiredSchema(mandatory, boolean()))
          .default(() => stringToBoolean(defaultValue))
          .yesOrNo(),
      }
    case USER_INPUT_TYPES.list: {
      const values = getOptionsFromList(options, sorter)
      const optionValues = values.map(({ value }) => value).filter(Boolean)
      const firstOption = optionValues[0] ?? undefined

      return {
        values,
        type: INPUT_TYPES.AUTOCOMPLETE,
        optionsOnly: true,
        validation: string()
          .trim()
          .concat(requiredSchema(mandatory, string()))
          .oneOf(optionValues)
          .default(() => defaultValue || firstOption),
      }
    }
    case USER_INPUT_TYPES.array: {
      const defaultValues = getValuesFromArray(defaultValue)

      return {
        type: INPUT_TYPES.AUTOCOMPLETE,
        multiple: true,
        tooltip: [T.PressKeysToAddAValue, ['ENTER, semicolon (;)']],
        fieldProps: { freeSolo: true, separators: [SEMICOLON_CHAR] },
        validation: array(string().trim())
          .concat(requiredSchema(mandatory, array()))
          .default(() => defaultValues)
          .afterSubmit((value) => value?.join(SEMICOLON_CHAR)),
      }
    }
    case USER_INPUT_TYPES.listMultiple: {
      const values = getOptionsFromList(options)
      const defaultValues = defaultValue?.split(',') ?? undefined

      return {
        values,
        type: INPUT_TYPES.AUTOCOMPLETE,
        optionsOnly: true,
        multiple: true,
        validation: array(string().trim())
          .concat(requiredSchema(mandatory, array()))
          .default(defaultValues),
      }
    }
    default:
      return {
        type: INPUT_TYPES.TEXT,
        validation: string()
          .trim()
          .concat(requiredSchema(mandatory, string()))
          .default(defaultValue || undefined),
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
  Object.entries(userInputs)?.reduce(
    (res, [key, value]) => ({
      ...res,
      [key]: parseUserInputValue(value),
    }),
    {}
  )

/**
 * Converts a list of values to usable options.
 *
 * @param {any[]} list - List of option values
 * @param {object} [options] - Options to conversion
 * @param {boolean|string} [options.addEmpty] - If `true`, add an empty option
 * @param {function(any, number):any} [options.getText] - Function to get the text option
 * @param {function(any, number):any} [options.getValue] - Function to get the value option
 * @param {function(any, any):any} [options.sorter] - Function to sort the options
 * @returns {SelectOption} Options
 */
export const arrayToOptions = (list = [], options = {}) => {
  const {
    addEmpty = true,
    addEmptyValue = '',
    getText = (o) => `${o}`,
    getValue = (o) => `${o}`,
    sorter = OPTION_SORTERS.default,
  } = options

  const values = list
    .map((item, idx) => ({
      text: getText(item, idx),
      value: getValue(item, idx),
    }))
    .sort(sorter)

  if (addEmpty) {
    typeof addEmpty === 'string'
      ? values.unshift({ text: addEmpty, value: addEmptyValue })
      : values.unshift({ text: '-', value: '' })
  }

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
export const createSteps =
  (steps, extraParams = {}) =>
  (stepProps = {}, initialValues) => {
    const { transformInitialValue = () => initialValues } = extraParams

    const stepCallbacks = typeof steps === 'function' ? steps(stepProps) : steps
    const performedSteps = stepCallbacks.map((step) => step(stepProps))

    // Generate the schema in the last instance
    const generateSchema = () => {
      const schemas = {}
      for (const { id, resolver } of performedSteps) {
        const schema = typeof resolver === 'function' ? resolver() : resolver

        schemas[id] = schema
      }

      return object(schemas)
    }

    const defaultValues = initialValues
      ? transformInitialValue(initialValues, generateSchema())
      : generateSchema().default()

    return {
      steps: performedSteps,
      defaultValues,
      resolver: generateSchema,
      initialValues,
      ...extraParams,
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
export const createForm =
  (schema, fields, extraParams = {}) =>
  (props = {}, initialValues) => {
    const schemaCallback = typeof schema === 'function' ? schema(props) : schema

    const disable =
      props?.oneConfig &&
      props?.adminGroup === false &&
      typeof props?.nameParentAttribute === 'string'
    const fieldsCallback = disable
      ? typeof fields === 'function'
        ? disableFields(
            fields(props),
            props.nameParentAttribute,
            props.oneConfig,
            props.adminGroup,
            props && props.restrictedAttributesType
              ? props.restrictedAttributesType
              : RESTRICTED_ATTRIBUTES_TYPE.VM
          )
        : disableFields(
            fields,
            props.nameParentAttribute,
            props.oneConfig,
            props.adminGroup,
            props && props.restrictedAttributesType
              ? props.restrictedAttributesType
              : RESTRICTED_ATTRIBUTES_TYPE.VM
          )
      : typeof fields === 'function'
      ? fields(props)
      : fields

    const defaultTransformInitialValue = (values) =>
      schemaCallback.cast(values, { stripUnknown: true })

    const {
      transformBeforeSubmit,
      transformInitialValue = defaultTransformInitialValue,
      ContentForm,
      ...restOfParams
    } = extraParams

    const defaultValues = initialValues
      ? transformInitialValue(initialValues, schemaCallback)
      : schemaCallback.default()

    const ensuredExtraParams = {}
    for (const [name, param] of Object.entries(restOfParams)) {
      const isFunction = typeof param === 'function'

      ensuredExtraParams[name] = isFunction ? param(props) : param
    }

    return {
      resolver: () => schemaCallback,
      fields: () => fieldsCallback,
      defaultValues,
      transformBeforeSubmit,
      ContentForm: ContentForm && (() => <ContentForm {...props} />),
      ...ensuredExtraParams,
    }
  }

/**
 * Disable fields that are restricted attributes in oned.conf.
 *
 * @param {Array} fields - Fields of the form
 * @param {string} nameParentAttribute - Parent name of the form
 * @param {object} oneConfig - Config of oned.conf
 * @param {boolean} adminGroup - It he user is an admin
 * @param {string} type - The type of restricted attributes use to filter
 * @returns {Array} - New array of fields
 */
export const disableFields = (
  fields = [],
  nameParentAttribute,
  oneConfig = {},
  adminGroup = true,
  type = RESTRICTED_ATTRIBUTES_TYPE.VM
) => {
  // Disable fields only if it is a non admin user
  if (adminGroup) return fields

  // Get restricted attributes
  const listRestrictedAttributes = oneConfig[type]
  const restrictedAttributes = listRestrictedAttributes
    .filter((item) =>
      nameParentAttribute !== ''
        ? item.startsWith(nameParentAttribute)
        : !item.includes('/')
    )
    .map((item) => item.split('/')[1] ?? item)

  // Iterate over each field and add disabled attribute if it's a restricted attribute (almost all forms has attributes with name like "ATTR" but some of them like "PARENT.ATTR")
  return fields.map((field) => {
    if (
      restrictedAttributes.some(
        (item) =>
          item === field.name || nameParentAttribute + '.' + item === field.name
      )
    ) {
      field.fieldProps = {
        ...field.fieldProps,
        disabled: true,
      }
    }

    return field
  })
}

/**
 * Calculate the index array without objects that have delete attribute.
 *
 * @param {Array} list - Array to filter
 * @param {number} position - Position to look for
 * @returns {number} - The index in the array
 */
export const calculateIndex = (list, position) => {
  let filteredIndex = -1
  let acc = 0

  for (let i = 0; i < list.length; i++) {
    if (!list[i].__delete__) {
      if (acc === position) {
        filteredIndex = i
        break
      }
      acc++
    }
  }

  return filteredIndex
}
