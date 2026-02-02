/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

/**
 *
 * Utils file for common function to use with ODS (OpenNebula Document Server) that is the Framework to build services like oneflow, oneform or oneks.
 *
 */

import { upperFirst, find, findKey, includes, isPlainObject } from 'lodash'
import { useFormContext } from 'react-hook-form'
import { boolean, number, string, object, array } from 'yup'

import {
  T,
  INPUT_TYPES,
  ODS_USER_INPUT_TYPES,
  ODSUserInput,
} from '@ConstantsModule'
import { Field, arrayToOptions } from '@modules/utils/schema'

/**
 * Groups the user inputs in a tab using the fireedge configuration from the driver configuration.
 * The return value will be an array (instead of an object) to preseve order of the user inputs.
 *
 * @param {Array} userInputs - List of user inputs
 * @param {Array} odsFireedgeGroups - List of groups for the user inputs
 * @param {string} providerName - Name of the provider
 * @returns {Array} List of user inputs group by app and group.
 */
export const groupUserInputs = (
  userInputs,
  odsFireedgeGroups,
  providerName
) => {
  // Groups using the data from the driver conf
  const groups = Object.entries(odsFireedgeGroups?.layout).map(([key]) => ({
    name: upperFirst(key),
    userInputs: [],
  }))

  // Array to store the user inputs that don't match the convention ONEAPP_<APP_NAME>_<GROUP_NAME>_<FIELD_NAME>
  const others = []

  // Iterate over each user input
  userInputs.forEach((userInput) => {
    // Get the parent key in odsFireedgeGroups
    const parentKey = findKey(odsFireedgeGroups?.layout, (values) =>
      includes(values, userInput.name)
    )

    // Check if the key matches the name of an user input
    if (parentKey) {
      // Add to corresponding group
      const group = find(groups, { name: upperFirst(parentKey) })
      group.userInputs.push(userInput)
    } else {
      // Assign value to others
      others.push(userInput)
    }
  })

  // Add others in last position if there is any attribute in others
  if (others && others?.length > 0) {
    groups.push({
      name: 'Others',
      userInputs: others,
    })
  }

  // Return array to have the same structure that user inputs in vm templates
  return [
    {
      name: upperFirst(providerName),
      groups: groups,
    },
  ]
}

// Functions or constants to use in schemaODSUserInputField

const requiredSchema = (mandatory, schema) =>
  mandatory ? schema.required() : schema.notRequired()

/**
 * Determine the type of the ODS User Input itself.
 *
 * @param {ODSUserInput} odsUserInput - ODS User Input
 * @returns {string} ODS User Input type
 */
const odsUserInputType = (odsUserInput) => {
  if (odsUserInput.match && odsUserInput.match.grouped_by) {
    return odsUserInput.type
  } else if (odsUserInput.match) {
    return odsUserInput.match.type
  } else {
    return odsUserInput.type
  }
}

/**
 * Builder to get the proper yup validator according to the field.
 *
 * @param {string} type - inferred ODS User Input type
 * @param {ODSUserInput} odsUserInput - ODS User Input
 * @returns {object} yup validator for ODS User Input and type of INPUT_VALUE
 */
const odsUserInputValidation = (type, odsUserInput) => {
  /**
   * Different types of objects (match property determines which kind of object it's dealt)
   * Strings
   * Numbers
   * Booleans
   * Lists
   * Depending Lists ==> match
   * Ranges ==> match
   * Map aka Objects
   */
  const { mandatory } = odsUserInput

  const {
    string: tstring,
    number: tnumber,
    bool: tbool,
    list: tlist,
    listString: tListString,
    map: tmap,
  } = ODS_USER_INPUT_TYPES

  let yupType, yupValidator, inputTypeValue

  switch (type) {
    case tstring: {
      yupType = string()
      inputTypeValue = INPUT_TYPES.TEXT
      break
    }
    case tnumber: {
      yupType = number()
      inputTypeValue = INPUT_TYPES.TEXT
      break
    }
    case tbool: {
      yupType = boolean()
      inputTypeValue = INPUT_TYPES.SWITCH
      break
    }
    case tlist: {
      yupType = string()
      inputTypeValue = INPUT_TYPES.AUTOCOMPLETE
      break
    }
    case tListString: {
      yupType = array(string())
      inputTypeValue = INPUT_TYPES.AUTOCOMPLETE
      break
    }
    case tmap: {
      // On first stage, map would be treated as INPUT_TYPES.AUTOCOMPLETE
      yupType = object()
      inputTypeValue = INPUT_TYPES.AUTOCOMPLETE
      break
    }
    default: {
      yupType = string()
      inputTypeValue = INPUT_TYPES.TEXT
      break
    }
  }

  yupValidator = requiredSchema(mandatory, yupType)

  if (odsUserInput.match && Array.isArray(odsUserInput.match.values)) {
    inputTypeValue = INPUT_TYPES.AUTOCOMPLETE
  } else if (odsUserInput.match && odsUserInput.match.grouped_by) {
    inputTypeValue = INPUT_TYPES.AUTOCOMPLETE
  } else if (
    odsUserInput.match &&
    odsUserInput.match.values &&
    'min' in odsUserInput.match.values &&
    'max' in odsUserInput.match.values
  ) {
    const min = odsUserInput.match.values.min
    const max = odsUserInput.match.values.max
    yupValidator = yupValidator.min(min).max(max)
    inputTypeValue = INPUT_TYPES.SLIDER
  }

  let defaultValue

  if (
    type === tListString &&
    Array.isArray(odsUserInput.default) &&
    odsUserInput.default.length === 0
  ) {
    yupValidator = yupValidator.default(() => '')
    defaultValue = ''
  } else if (
    odsUserInput.default &&
    inputTypeValue === INPUT_TYPES.AUTOCOMPLETE
  ) {
    const option = odsUserInput.default
    yupValidator = yupValidator.default(() => option)
    defaultValue = odsUserInput.default
  } else if (odsUserInput.default) {
    yupValidator = yupValidator.default(() => odsUserInput.default)
    defaultValue = odsUserInput.default
  }

  return {
    validation: yupValidator,
    inputType: inputTypeValue,
    defaultValue: defaultValue,
  }
}

/**
 * @param {ODSUserInput} odsUserInput - ODS User Input
 * @returns {Field} Field Properties
 */
export const schemaOdsUserInputField = (odsUserInput = {}) => {
  // Get base input type for ODS User Input
  const type = odsUserInputType(odsUserInput)

  // Get yup validator, input type and default value for ODS User Input
  const { validation, inputType, defaultValue } = odsUserInputValidation(
    type,
    odsUserInput
  )

  // Base Field config for odsUserInput
  const odsUserInputLabel = T[odsUserInput.name] ?? odsUserInput.name
  const config = {
    name: odsUserInput.name,
    label: odsUserInputLabel,
    tooltip: odsUserInput.description,
    grid: { md: 6 },
  }

  const {
    string: tstring,
    number: tnumber,
    bool: tbool,
    list: tlist,
    listString: tListString,
    map: tmap,
  } = ODS_USER_INPUT_TYPES

  let values

  switch (type) {
    case tstring: {
      config.type = inputType

      config.validation = validation

      if (odsUserInput.match && Array.isArray(odsUserInput.match.values)) {
        const match = odsUserInput.match
        values = match.values.map((option) => ({
          text: option,
          value: option,
        }))
        config.values = values

        config.optionsOnly = true
      } else if (
        odsUserInput.match &&
        isPlainObject(odsUserInput.match.values) &&
        odsUserInput.match.grouped_by
      ) {
        const dependentValues = (dependencies = []) => {
          const [dependencyValue] = dependencies
          const matchValues = odsUserInput.match.values[dependencyValue] || []
          if (!matchValues.length) {
            const { setValue } = useFormContext()
            setValue(odsUserInput.name, '')
          }

          return arrayToOptions(matchValues, { addEmpty: true })
        }
        const dependency = odsUserInput.match.grouped_by
        config.values = dependentValues
        config.optionsOnly = true
        config.clearInvalid = true
        config.dependOf = [dependency]
      }

      break
    }

    case tnumber: {
      config.type = inputType
      config.validation = validation

      if (
        odsUserInput.match &&
        isPlainObject(odsUserInput.match.values) &&
        'min' in odsUserInput.match.values &&
        'max' in odsUserInput.match.values
      ) {
        config.grid = { xs: 12, md: 6 }
        config.fieldProps = {
          min: odsUserInput.match.values.min,
          max: odsUserInput.match.values.max,
          step: 1,
        }
      }

      break
    }
    case tbool: {
      config.type = inputType
      config.validation = validation.yesOrNo()
      config.grid = { md: 12 }

      break
    }

    // At first stage, we treat maps and list as the same
    case tlist: {
      // Get list values
      values = odsUserInput.match.values.map((option) => ({
        text: option,
        value: option,
      }))

      config.type = inputType

      config.validation = validation

      if (odsUserInput.match && odsUserInput.grouped_by) {
        const match = odsUserInput.match
        values = match.values.map((option) => ({
          text: option,
          value: option,
        }))
        config.values = values
        config.dependencies = odsUserInput.grouped_by
        config.optionsOnly = true
      } else if (odsUserInput.match) {
        const match = odsUserInput.match
        values = match.values.map((option) => ({
          text: option,
          value: option,
        }))
        config.values = values

        config.optionsOnly = true
      } else {
        // values: List of values to show to the user
        config.values = values
        // optionsOnly: Restrict to the values of the list so the user cannot type a different value
        config.optionsOnly = true
      }

      break
    }

    // oneform_onprem_hosts is the only value that is a list(string),
    // so, it has is own custom tooltip
    case tListString: {
      config.type = inputType
      config.tooltip = [T.PressKeysToAddAHost, ['ENTER']]
      config.validation = validation
      config.multiple = true
      break
    }

    case tmap: {
      config.type = inputType
      config.validation = validation

      break
    }

    default: {
      config.type = inputType
      config.validation = validation

      break
    }
  }

  if (defaultValue) {
    config.defaultValue = defaultValue
  }

  return config
}
