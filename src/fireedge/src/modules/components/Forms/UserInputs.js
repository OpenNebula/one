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

import { Component, useMemo } from 'react'
import { array, boolean, number, string } from 'yup'
import { find, groupBy, mapValues } from 'lodash'

import {
  INPUT_TYPES,
  USER_INPUT_TYPES,
  UserInputObject,
} from '@ConstantsModule'
import { stringToBoolean, userInputsToArray } from '@ModelsModule'
import { BaseTab as Tabs } from '@modules/components/Tabs'
import { Translate } from '@modules/components/HOC'
import FormWithSchema from '@modules/components/Forms/FormWithSchema'
import { Field, arrayToOptions, responseDataToArray } from '@UtilsModule'
import { useFormContext } from 'react-hook-form'
import { Alert } from '@mui/material'

// Functions or constants to use in schemaUserInput
const requiredSchema = (mandatory, schema) =>
  mandatory ? schema.required() : schema.notRequired()
const getRange = (options) => options?.split?.('..').map(parseFloat)
const getOptionsFromList = (options = [], sorter) => {
  const config = { addEmpty: false }
  sorter && (config.sorter = sorter)

  return arrayToOptions([...new Set(options)], config)
}
const commonHtmlType = (htmlType) => !htmlType && INPUT_TYPES.HIDDEN

/**
 * Get field properties to represent an user input defined by OpenNebula.
 *
 * @param {UserInputObject} userInput - User input from OpenNebula document
 * @returns {Field} Field properties
 */
const schemaUserInput = ({
  mandatory,
  type,
  min,
  max,
  options,
  default: defaultValue,
  sorter,
  dependOf,
}) => {
  // Object with common properties to all type of fields
  const config = {
    // htmlType: Only overwrite if the field needs a specific configuration.
    htmlType: commonHtmlType,

    // dependOf: Add dependency with boolean values
    dependOf: dependOf,

    // grid: By default, all fields will use 6
    grid: { md: 6 },
  }

  // Each type of user input has a different way to create the field
  switch (type) {
    // FIXED
    case USER_INPUT_TYPES.fixed: {
      // Check if the value is numeric or not
      const isNumeric = !isNaN(defaultValue)

      // If it's numeric, parse to float
      const ensuredValue = isNumeric ? parseFloat(defaultValue) : defaultValue

      // Validation with numeric or string
      const validation = isNumeric ? number() : string().trim()

      // type: Always INPUT_TYPES.TEXT (numeric only changes validation, not type)
      config.type = INPUT_TYPES.TEXT

      // htmlType: text or number, depending of the default value
      config.htmlType = isNaN(+defaultValue)
        ? (htmlType) => (!htmlType ? INPUT_TYPES.HIDDEN : 'text')
        : (htmlType) => (!htmlType ? INPUT_TYPES.HIDDEN : 'number')

      // validation
      config.validation = validation
        .default(ensuredValue)
        .concat(requiredSchema(mandatory, isNumeric ? number() : string()))
        .afterSubmit(() => defaultValue)

      // fieldProps: Always disable edit in fixed values becuase user can only see the value, not change it
      config.fieldProps = { disabled: true }

      // readOnly: Always disable edit in fixed values becuase user can only see the value, not change it
      config.readOnly = true

      return config
    }

    // TEXT
    case USER_INPUT_TYPES.text: {
      // type
      config.type = INPUT_TYPES.TEXT
      config.multiline = true

      // validation
      config.validation = requiredSchema(mandatory, string()).default(
        () => defaultValue
      )

      return config
    }

    // TEXT64
    case USER_INPUT_TYPES.text64: {
      // type
      config.type = INPUT_TYPES.TEXT
      config.multiline = true

      // htmlType
      config.htmlType = (htmlType) => (!htmlType ? INPUT_TYPES.HIDDEN : 'text')

      // validation
      config.validation = string()
        .trim()
        .concat(requiredSchema(mandatory, string()))
        .default(() => defaultValue)

      return config
    }

    // PASSWORD
    case USER_INPUT_TYPES.password: {
      // type
      config.type = INPUT_TYPES.TEXT

      // htmlType
      config.htmlType = (htmlType) =>
        !htmlType ? INPUT_TYPES.HIDDEN : 'password'

      // validation
      config.validation = string()
        .trim()
        .concat(requiredSchema(mandatory, string()))
        .default(() => defaultValue)

      return config
    }

    // NUMBER
    case USER_INPUT_TYPES.number: {
      // Number is used to define an integer, so parse default value to integer
      const ensuredValue = parseInt(defaultValue)

      // type
      config.type = INPUT_TYPES.TEXT

      // htmlType
      config.htmlType = (htmlType) =>
        !htmlType ? INPUT_TYPES.HIDDEN : 'number'

      // validation
      config.validation = number()
        .integer()
        .concat(requiredSchema(mandatory, number()))
        .transform((value) => (!isNaN(value) ? value : null))
        .default(() => (!isNaN(ensuredValue) ? ensuredValue : undefined))

      return config
    }

    // NUMBER FLOAT
    case USER_INPUT_TYPES.numberFloat: {
      // Number is used to define a float, so parse default value to float
      const ensuredValue = parseFloat(defaultValue)

      // type
      config.type = INPUT_TYPES.TEXT

      // htmlType
      config.htmlType = (htmlType) =>
        !htmlType ? INPUT_TYPES.HIDDEN : 'number'

      // validation
      config.validation = number()
        .concat(requiredSchema(mandatory, number()))
        .transform((value) => (!isNaN(value) ? value : null))
        .default(() => (!isNaN(ensuredValue) ? ensuredValue : undefined))

      return config
    }

    // RANGE
    case USER_INPUT_TYPES.range: {
      // Range is used to define an integer range, so get min, max and default values and parse to int
      const [minimum, maximum] =
        getRange(options) ?? [min, max].map((elem) => parseInt(elem))
      const ensuredValue = parseInt(defaultValue)

      // type
      config.type = INPUT_TYPES.SLIDER

      // validation
      config.validation = number()
        .integer()
        .concat(requiredSchema(mandatory, number()))
        .min(minimum)
        .max(maximum)
        .transform((value) => (!isNaN(value) ? value : undefined))
        .default(() => (!isNaN(ensuredValue) ? ensuredValue : minimum))

      // fieldProps
      config.fieldProps = {
        min: minimum,
        max: maximum,
        step: 1,
      }

      return config
    }
    case USER_INPUT_TYPES.rangeFloat: {
      // Range float is used to define a float range, so get min, max and default values and parse to float
      const [minimum, maximum] =
        getRange(options) ?? [min, max].map((elem) => parseFloat(elem))
      const ensuredValue = parseFloat(defaultValue)

      // type
      config.type = INPUT_TYPES.SLIDER

      // validation
      config.validation = number()
        .concat(requiredSchema(mandatory, number()))
        .min(minimum)
        .max(maximum)
        .transform((value) => (!isNaN(value) ? value : undefined))
        .default(() => (!isNaN(ensuredValue) ? ensuredValue : minimum))

      // fieldProps
      config.fieldProps = {
        min: minimum,
        max: maximum,
        step: 0.1,
      }

      return config
    }

    // BOOLEAN
    case USER_INPUT_TYPES.boolean: {
      // type
      config.type = INPUT_TYPES.SWITCH

      // validation
      config.validation = boolean()
        .concat(requiredSchema(mandatory, boolean()))
        .default(() => stringToBoolean(defaultValue))
        .yesOrNo()

      // grid: Boolean fields fill the whole row
      config.grid = { md: 12 }

      return config
    }

    // LIST
    case USER_INPUT_TYPES.list: {
      // Get list values
      const values = getOptionsFromList(options, sorter)

      // type
      config.type = INPUT_TYPES.AUTOCOMPLETE

      // validation
      config.validation = string()
        .trim()
        .concat(requiredSchema(mandatory, string()))
        .default(() => defaultValue)

      // values: List of values to show to the user
      config.values = values

      // optionsOnly: Restrict to the values of the list so the user cannot type a different value
      config.optionsOnly = true

      return config
    }

    // LIST MULTIPLE
    case USER_INPUT_TYPES.listMultiple: {
      // Get list values and default values
      const values = getOptionsFromList(options)
      const defaultValues = defaultValue ? defaultValue?.split(',') : undefined

      // type
      config.type = INPUT_TYPES.AUTOCOMPLETE

      // validation
      config.validation = array(string().trim())
        .concat(requiredSchema(mandatory, array()))
        .default(() => defaultValues)

      // values: List of values to show to the user
      config.values = values

      // optionsOnly: Restrict to the values of the list so the user cannot type a different value
      config.optionsOnly = true

      // multiple: Let the user select not only one value
      config.multiple = true

      return config
    }

    // DEFAULT CASE
    default: {
      // type
      config.type = INPUT_TYPES.TEXT

      // validation
      config.validation = string()
        .trim()
        .concat(requiredSchema(mandatory, string()))
        .default(() => defaultValue)

      return config
    }
  }
}

/**
 * Component with the content to render in a user inputs tab.
 *
 * @param {string} appName - Name of the app
 * @param {string} appDescription - Description of the app
 * @param {Array} groups - Groups that belong to the app
 * @param {string} STEP_ID - Step identifier
 * @param {object} FIELDS - Fields to render
 * @param {boolean} showMandatoryOnly - Show only mandatory user inputs
 * @returns {Function} Function to render the content
 */
const userInputsTabContent = (
  appName,
  appDescription,
  groups,
  STEP_ID,
  FIELDS,
  showMandatoryOnly
) => {
  const UserInputContent = () => (
    <>
      {appDescription && (
        <Alert severity="info" variant="outlined">
          {appDescription}
        </Alert>
      )}
      {groups.map(
        ({
          name: groupName,
          title: groupTitle,
          description: groupDescription,
          userInputs: userInputsGroup,
        }) => (
          <FormWithSchema
            key={`user-inputs-${appName}-${groupName}`}
            cy={`user-inputs-${appName}-${groupName}`}
            id={STEP_ID}
            fields={
              showMandatoryOnly
                ? FIELDS(
                    userInputsGroup.filter((userInput) => userInput.mandatory)
                  )
                : FIELDS(userInputsGroup)
            }
            legend={groupTitle || groupName}
            legendTooltip={groupDescription}
          />
        )
      )}
    </>
  )

  UserInputContent.diplayName = 'UserInputContent'

  return UserInputContent
}

/**
 * Generates tabs for each group of user inputs.
 *
 * @param {object} userInputsLayout - User inputs groups by group
 * @param {string} STEP_ID - Step identifier
 * @param {Array} FIELDS - List of fields
 * @param {boolean} showMandatoryOnly - Show only mandatory inputs
 * @returns {Component} Tabs component
 */
const generateTabs = (userInputsLayout, STEP_ID, FIELDS, showMandatoryOnly) => {
  const {
    formState: { errors },
  } = useFormContext()

  const totalErrors = Object.keys(errors[STEP_ID] ?? {}).length

  // No render tabs is there is only one tab called "others". That means that this app is not following the user inputs convention.
  if (userInputsLayout.length === 1 && userInputsLayout[0].name === 'others') {
    return (
      <FormWithSchema
        key={`user-inputs`}
        cy={`user-inputs`}
        id={STEP_ID}
        fields={FIELDS(
          userInputsLayout[0].groups[0].userInputs.filter(
            (userInput) => !showMandatoryOnly || userInput.mandatory
          )
        )}
      />
    )
  }

  // Iterate over each group of the user inputs layout
  const tabs = useMemo(
    () =>
      userInputsLayout
        .map(({ name: appName, title, description: appDescription, groups }) =>
          // Create an object to represent a tab, adding the Content of the tab
          ({
            id: appName,
            name: title || appName,
            Content: userInputsTabContent(
              appName.replace(/\s+/g, ''),
              appDescription,
              groups,
              STEP_ID,
              FIELDS,
              showMandatoryOnly
            ),
            getError: (error) =>
              FIELDS(groups.flatMap((group) => group.userInputs)).some(
                ({ name }) => error?.[name]
              ),
          })
        )
        .map(({ Content: TabContent, name, id, getError, ...section }) =>
          // Create tab
          ({
            ...section,
            name,
            id: id?.replace(/\s+/g, ''), // Id without spaces
            label: <Translate word={name} />,
            renderContent: () => <TabContent />,
            error: getError?.(errors[STEP_ID]),
          })
        ),
    [totalErrors, showMandatoryOnly]
  )

  // Render tabs
  return <Tabs addBorder tabs={tabs} />
}

/**
 * Create a list of fields to use in the schema and in forms from the list of user inputs.
 *
 * @param {Array} userInputs - List of user inputs.
 * @returns {Array} - List of fields.
 */
const createFieldsFromUserInputs = (userInputs = []) => {
  const res = userInputs.map(
    ({ name, description, label, ...restOfUserInput }) => ({
      name,
      label: label || name,
      ...(description && { tooltip: description }),
      ...schemaUserInput(restOfUserInput),
    })
  )

  return res
}

/**
 * Groups the user inputs by app and group using the following convetion: ONEAPP_<APP_NAME>_<GROUP_NAME>_<FIELD_NAME>.
 * The return value will be an array (instead of an object) to preseve order of the user inputs.
 *
 * @param {Array} userInputs - List of user inputs
 * @param {Array} userInputsMetadata - List of metadata for the user inputs
 * @param {string} prefix - String to add in the apps name (useful to group also by roles)
 * @returns {Array} List of user inputs group by app and group.
 */
const groupUserInputs = (userInputs, userInputsMetadata, prefix) => {
  // Group by TYPE attribute
  const metadata = userInputsMetadata
    ? mapValues(
        groupBy(userInputsMetadata, (obj) => obj.TYPE || obj.type),
        (group) =>
          mapValues(
            groupBy(group, (obj) => obj.NAME || obj.name),
            (value) => value[0]
          )
      )
    : undefined

  // Create user inputs layout array
  const userInputsLayout = []

  // Array to store the user inputs that don't match the convention ONEAPP_<APP_NAME>_<GROUP_NAME>_<FIELD_NAME>
  const others = []

  // Iterate over each user input
  userInputs.forEach((userInput) => {
    // Split the user input by '_'
    const parts = userInput.name.split('_')

    // Check if the key matches the convention: ONEAPP_<APP_NAME>_<GROUP_NAME>_<FIELD_NAME>
    if (parts.length >= 4 && parts[0] === 'ONEAPP') {
      // Extract parts
      const app = parts[1]
      const group = parts[2]
      const name = parts[3]

      // Add dependencies of enable user inputs.
      if (name !== 'ENABLED') {
        const enabledUserInput = find(userInputs, {
          name: `ONEAPP_${app}_${group}_ENABLED`,
        })
        enabledUserInput && (userInput.dependOf = enabledUserInput.name)
      }

      // Get if the app and group are already created on the userInputsLayout array
      let existingApp = find(userInputsLayout, {
        name: (prefix ? prefix + ' - ' : '') + app,
      })
      let existingAppGroup = existingApp
        ? find(existingApp?.groups, { name: group })
        : undefined

      // Initialize nested structure if not present
      if (!existingApp) {
        const newApp = {
          name: (prefix ? prefix + ' - ' : '') + app,
          title:
            metadata?.APP &&
            metadata?.APP[app] &&
            (metadata?.APP[app].TITLE || metadata?.APP[app].title),
          description:
            metadata?.APP &&
            metadata?.APP[app] &&
            (metadata?.APP[app].DESCRIPTION || metadata?.APP[app].description),
          groups: [],
        }
        userInputsLayout.push(newApp)
        existingApp = newApp
      }
      if (!existingAppGroup) {
        const newGroup = {
          name: group,
          title:
            metadata?.GROUP &&
            metadata?.GROUP[group] &&
            (metadata?.GROUP[group].TITLE || metadata?.GROUP[group].title),
          description:
            metadata?.GROUP &&
            metadata?.GROUP[group] &&
            (metadata?.GROUP[group].DESCRIPTION ||
              metadata?.GROUP[group].description),
          userInputs: [],
        }
        existingApp.groups.push(newGroup)
        existingAppGroup = newGroup
      }

      // Assign value to the nested object
      existingAppGroup.userInputs.push(userInput)
    } else {
      // Assign value to others
      others.push(userInput)
    }
  })

  // Add others in last position if there is any attribute in others
  if (others && others?.length > 0) {
    userInputsLayout.push({
      name: (prefix ? prefix + ' - ' : '') + 'others',
      groups: [
        {
          name: 'others',
          userInputs: others,
        },
      ],
    })
  }

  return userInputsLayout
}

/**
 * Group user input templates in service. That means to join the user inputs from the role templates with the ones in the service template.
 * Service user inputs will have priority against the ones in roles.
 *
 * @param {object} service - All data of the service
 * @returns {object} List of user inputs with layout
 */
const groupServiceUserInputs = (service) => {
  // Get and order service user inputs
  const serviceUserInputs = userInputsToArray(
    service?.TEMPLATE?.BODY?.user_inputs
  )

  // Get service user inputs metadata
  const serviceUserInputsMetadata = responseDataToArray(
    service?.TEMPLATE?.BODY?.user_inputs_metadata
  )

  const serviceUserInputsLayout = groupUserInputs(
    serviceUserInputs,
    serviceUserInputsMetadata
  )

  // Create lists for user inputs to store role user inputs
  const roleUserInputsList = []
  const roleUserInputsLayoutList = []

  // Iterate over each
  service?.TEMPLATE?.BODY?.roles?.forEach((role) => {
    // Get user inputs
    const roleVmContentUserInputs =
      role.vm_template_id_content?.TEMPLATE?.USER_INPUTS

    // Order and get metadata
    const roleUserInputs = userInputsToArray(roleVmContentUserInputs)?.filter(
      (input) =>
        !serviceUserInputs.some(
          (serviceInput) => serviceInput.name === input.name
        )
    )
    const roleUserInputsMetadata = responseDataToArray(
      role.vm_template_id_content?.TEMPLATE?.USER_INPUTS_METADATA
    )
    const roleUserInputsLayout = groupUserInputs(
      roleUserInputs,
      roleUserInputsMetadata,
      role.name
    )

    // Add user inputs to the list
    roleUserInputsList.push(...roleUserInputs)
    roleUserInputsLayoutList.push(...roleUserInputsLayout)
  })

  // Return user inputs group by apps and groups
  return {
    service: {
      userInputs: serviceUserInputs,
      userInputsLayout: serviceUserInputsLayout,
    },
    roles: {
      userInputs: roleUserInputsList,
      userInputsLayout: roleUserInputsLayoutList,
    },
  }
}

export {
  generateTabs,
  createFieldsFromUserInputs,
  groupUserInputs,
  groupServiceUserInputs,
}
