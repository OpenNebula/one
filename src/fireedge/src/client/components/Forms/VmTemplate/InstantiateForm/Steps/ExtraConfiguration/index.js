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
import { useMemo } from 'react'
import PropTypes from 'prop-types'

import { useFormContext } from 'react-hook-form'
import { useTheme } from '@material-ui/core'
import { WarningCircledOutline as WarningIcon } from 'iconoir-react'

import { useAuth } from 'client/features/Auth'
import { Tr } from 'client/components/HOC'

import Tabs from 'client/components/Tabs'
import Storage from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/storage'
import Networking from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/networking'
import Placement from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/placement'
import ScheduleAction from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/scheduleAction'
import Booting from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/booting'

import { STEP_ID as TEMPLATE_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/VmTemplatesTable'
import { SCHEMA } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/schema'
import { getActionsAvailable } from 'client/models/Helper'
import { T } from 'client/constants'

export const STEP_ID = 'extra'

const Content = ({ data, setFormData }) => {
  const theme = useTheme()
  const { watch, errors, control } = useFormContext()
  const { view, getResourceView } = useAuth()

  const tabs = useMemo(() => {
    const hypervisor = watch(`${TEMPLATE_ID}[0].TEMPLATE.HYPERVISOR`)
    const dialog = getResourceView('VM-TEMPLATE')?.dialogs?.instantiate_dialog
    const groupsAvailable = getActionsAvailable(dialog, hypervisor)

    return [
      {
        id: 'storage',
        name: Tr(T.Storage),
        renderContent: <Storage {...{ data, setFormData, hypervisor, control }} />,
        icon: errors[STEP_ID]?.[0] && (
          <WarningIcon color={theme.palette.error.main} />
        )
      },
      {
        id: 'network',
        name: Tr(T.Network),
        renderContent: <Networking {...{ data, setFormData, hypervisor, control }} />,
        icon: errors[STEP_ID]?.[1] && (
          <WarningIcon color={theme.palette.error.main} />
        )
      },
      {
        id: 'placement',
        name: Tr(T.Placement),
        renderContent: <Placement {...{ data, setFormData, hypervisor, control }} />,
        icon: errors[STEP_ID]?.[2] && (
          <WarningIcon color={theme.palette.error.main} />
        )
      },
      {
        id: 'sched_action',
        name: Tr(T.ScheduledAction),
        renderContent: <ScheduleAction {...{ data, setFormData, hypervisor, control }} />,
        icon: errors[STEP_ID]?.[3] && (
          <WarningIcon color={theme.palette.error.main} />
        )
      },
      {
        id: 'booting',
        name: Tr(T.OSBooting),
        renderContent: <Booting {...{ data, setFormData, hypervisor, control }} />,
        icon: errors[STEP_ID]?.[4] && (
          <WarningIcon color={theme.palette.error.main} />
        )
      }
    ].filter(({ id }) => groupsAvailable.includes(id))
  }, [errors[STEP_ID], view, control])

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
