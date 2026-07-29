/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import PropTypes from 'prop-types'
import { Component, useMemo, useState } from 'react'
import { Alert, Box, Stack } from '@mui/material'

import { FormWithSchema } from '@modules/componentsv2/composed/Forms/FormWithSchema'
import { Tabs } from '@modules/componentsv2/primitives/Tabs/Default'
import { useFormContext } from 'react-hook-form'

const getUserInputFields = (userInputsLayout = []) =>
  userInputsLayout
    ?.flatMap((layout) =>
      layout?.groups?.flatMap((userInput) => userInput?.userInputs)
    )
    ?.reduce(
      (acc, input) => {
        if (!acc.seen.has(input?.name)) {
          acc.seen.add(input.name)
          acc.list.push(input)
        }

        return acc
      },
      { seen: new Set(), list: [] }
    ).list

/**
 * Component with the content to render in a user inputs tab.
 *
 * @param {object} props - Component props
 * @param {string} props.appName - Name of the app
 * @param {string} props.appDescription - Description of the app
 * @param {Array} props.groups - Groups that belong to the app
 * @param {string} props.stepId - Step identifier
 * @param {Function} props.fields - Fields to render
 * @param {boolean} props.showMandatoryOnly - Show only mandatory user inputs
 * @returns {Component} Tab content
 */
const UserInputsTabContent = ({
  appName,
  appDescription,
  groups = [],
  stepId,
  fields,
  showMandatoryOnly,
}) => (
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
        userInputs: userInputsGroup = [],
      }) => (
        <FormWithSchema
          key={`user-inputs-${appName}-${groupName}`}
          cy={`user-inputs-${appName}-${groupName}`}
          id={stepId}
          fields={
            showMandatoryOnly
              ? fields(
                  userInputsGroup.filter((userInput) => userInput.mandatory)
                )
              : fields(userInputsGroup)
          }
          legend={groupTitle || groupName}
          legendTooltip={groupDescription}
        />
      )
    )}
  </>
)

/**
 * Generates tabs for each group of user inputs.
 *
 * @param {object} props - Component props
 * @param {object} props.userInputsLayout - User inputs groups by group
 * @param {string} props.stepId - Step identifier
 * @param {Function} props.fields - List of fields
 * @param {boolean} props.showMandatoryOnly - Show only mandatory inputs
 * @param {boolean} props.addAppNameToField - Adds step ID to fields
 * @returns {Component} Tabs component
 */
const UserInputsTabs = ({
  userInputsLayout = [],
  stepId,
  fields,
  showMandatoryOnly,
  addAppNameToField = false,
}) => {
  const [selected, setSelected] = useState(0)

  const {
    formState: { errors },
  } = useFormContext()

  const stepErrors = errors[stepId]

  const userInputFields = useMemo(
    () => getUserInputFields(userInputsLayout),
    [userInputsLayout]
  )

  const tabs = useMemo(
    () =>
      userInputsLayout.map(
        ({
          name: appName,
          title,
          description: appDescription,
          groups = [],
        }) => {
          const tabName = title || appName
          const tabId = appName?.replace(/\s+/g, '')
          const tabFields = fields(groups.flatMap((group) => group.userInputs))

          return {
            id: tabId,
            title: tabName,
            getError: (error) => tabFields.some(({ name }) => error?.[name]),
            Content: () => (
              <UserInputsTabContent
                appName={tabId}
                appDescription={appDescription}
                groups={groups}
                stepId={
                  addAppNameToField
                    ? `${stepId}.${appName?.split('-')?.[0]?.trim()}`
                    : stepId
                }
                fields={fields}
                showMandatoryOnly={showMandatoryOnly}
              />
            ),
          }
        }
      ),
    [addAppNameToField, fields, showMandatoryOnly, stepId, userInputsLayout]
  )

  const {
    id: activeId,
    title: activeTitle,
    Content,
  } = tabs[selected] ?? tabs[0] ?? {}

  if (userInputsLayout.length === 1 && userInputsLayout[0].name === 'others') {
    return (
      <FormWithSchema
        key="user-inputs"
        cy="user-inputs"
        id={stepId}
        fields={fields(userInputFields)}
      />
    )
  }

  return (
    <Stack sx={{ height: 'auto' }}>
      <Tabs
        type="line"
        defaultSelect={0}
        options={tabs.map(({ title, getError }, idx) => ({
          title,
          value: idx,
          error: !!getError?.(stepErrors),
        }))}
        onChange={(idx) => setSelected(idx)}
      />
      {Content && (
        <Box
          key={`tab-${activeId ?? activeTitle}`}
          data-cy={`tab-content-${activeId ?? activeTitle}`}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Content />
        </Box>
      )}
    </Stack>
  )
}

/**
 * Generates tabs for each group of user inputs.
 *
 * @param {object} userInputsLayout - User inputs groups by group
 * @param {string} STEP_ID - Step identifier
 * @param {Function} FIELDS - List of fields
 * @param {boolean} showMandatoryOnly - Show only mandatory inputs
 * @param {boolean} addAppNameToField - Adds step ID to fields
 * @returns {Component} Tabs component
 */
export const generateTabs = (
  userInputsLayout,
  STEP_ID,
  FIELDS,
  showMandatoryOnly,
  addAppNameToField = false
) => (
  <UserInputsTabs
    userInputsLayout={userInputsLayout}
    stepId={STEP_ID}
    fields={FIELDS}
    showMandatoryOnly={showMandatoryOnly}
    addAppNameToField={addAppNameToField}
  />
)

UserInputsTabContent.propTypes = {
  appName: PropTypes.string,
  appDescription: PropTypes.string,
  groups: PropTypes.array,
  stepId: PropTypes.string,
  fields: PropTypes.func,
  showMandatoryOnly: PropTypes.bool,
}

UserInputsTabs.propTypes = {
  userInputsLayout: PropTypes.array,
  stepId: PropTypes.string,
  fields: PropTypes.func,
  showMandatoryOnly: PropTypes.bool,
  addAppNameToField: PropTypes.bool,
}
