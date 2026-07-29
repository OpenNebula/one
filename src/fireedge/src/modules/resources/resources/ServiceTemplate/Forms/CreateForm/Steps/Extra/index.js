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
import { Component, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import PropTypes from 'prop-types'
import { Box, Stack } from '@mui/material'
import { SCHEMA } from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra/schema'

import Networking from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra/networking'

import UserInputs from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra/userInputs'

import ScheduledActions from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra/scheduledActions'

import AdvancedOptions from '@modules/resources/resources/ServiceTemplate/Forms/CreateForm/Steps/Extra/advancedParams'

import { T } from '@ConstantsModule'
import { Tabs } from '@ComponentsV2Module'

export const STEP_ID = 'extra'

export const TABS = [Networking, UserInputs, ScheduledActions, AdvancedOptions]

const Content = () => {
  const {
    control,
    formState: { errors },
  } = useFormContext()
  const stepErrors = errors[STEP_ID]
  const [selected, setSelected] = useState(0)

  const tabs = useMemo(
    () =>
      TABS.map(
        ({
          Content: TabContent,
          id,
          name,
          icon,
          getError,
          ...section
        } = {}) => ({
          ...section,
          id,
          title: name,
          startIcon: icon,
          getError,
          Content: () => (
            <TabContent
              {...{
                control,
              }}
            />
          ),
        })
      ),
    [control]
  )

  const {
    id: activeId,
    title: activeTitle,
    Content: ActiveContent,
  } = tabs[selected] ?? tabs[0] ?? {}

  return (
    <Stack sx={{ height: 'auto', mt: 2 }}>
      <Tabs
        type="line"
        defaultSelect={0}
        options={tabs.map(({ title, startIcon, getError }, idx) => ({
          title,
          value: idx,
          startIcon,
          error: !!getError?.(stepErrors),
        }))}
        onChange={(idx) => setSelected(idx)}
      />
      {ActiveContent && (
        <Box
          key={`tab-${activeId ?? activeTitle}`}
          data-cy={`tab-content-${activeId ?? activeTitle}`}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ActiveContent />
        </Box>
      )}
    </Stack>
  )
}

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object,
}

/**
 *@returns {Component} - Extra step
 */
const Extra = () => ({
  id: STEP_ID,
  label: T.Extra,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

export default Extra
