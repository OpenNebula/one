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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'

import { useFormContext } from 'react-hook-form'
import { useTheme } from '@material-ui/core'
import { WarningCircledOutline as WarningIcon } from 'iconoir-react'

import Tabs from 'client/components/Tabs'
import { SCHEMA } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/schema'
import Storage from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/storage'
import Networking from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/networking'
import Placement from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/placement'
import ScheduleAction from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/scheduleAction'
import Booting from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/booting'
import { T } from 'client/constants'

export const STEP_ID = 'extra'

const Content = ({ data, setFormData }) => {
  const theme = useTheme()
  const { errors } = useFormContext()

  const tabs = [
    {
      name: 'storage',
      renderContent: Storage({ data, setFormData })
    },
    {
      name: 'network',
      renderContent: Networking({ data, setFormData })
    },
    {
      name: 'placement',
      renderContent: Placement({ data, setFormData })
    },
    {
      name: 'schedule action',
      renderContent: ScheduleAction({ data, setFormData })
    },
    {
      name: 'os booting',
      renderContent: Booting({ data, setFormData })
    }
  ]
    .map((tab, idx) => ({
      ...tab,
      icon: errors[STEP_ID]?.[idx] && (
        <WarningIcon color={theme.palette.error.main} />
      )
    }))

  return (
    <Tabs tabs={tabs} />
  )
}

const ExtraConfiguration = () => ({
  id: STEP_ID,
  label: T.AdvancedOptions,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func
}

export default ExtraConfiguration
