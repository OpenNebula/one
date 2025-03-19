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
import { useFormContext } from 'react-hook-form'
import PropTypes from 'prop-types'
import { SCHEMA } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/schema'

import Networking from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking'

import UserInputs from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/userInputs'

import ScheduledActions from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/scheduledActions'

import AdvancedOptions from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/advancedParams'

import { T } from '@ConstantsModule'
import { BaseTab as Tabs } from '@modules/components/Tabs'

export const STEP_ID = 'extra'

export const TABS = [Networking, UserInputs, ScheduledActions, AdvancedOptions]

const Content = () => {
  const { control } = useFormContext()
  const tabs = useMemo(
    () =>
      TABS.map(({ Content: TabContent, name, getError, ...section } = {}) => ({
        ...section,
        name,
        label: name,
        renderContent: () => (
          <TabContent
            {...{
              control,
            }}
          />
        ),
      })),
    [STEP_ID]
  )

  return <Tabs tabs={tabs} />
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
