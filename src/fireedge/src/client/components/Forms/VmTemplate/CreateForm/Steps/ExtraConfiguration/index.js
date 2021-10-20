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
import { useTheme } from '@mui/material'
import {
  WarningCircledOutline as WarningIcon,
  Db as DatastoreIcon,
  ServerConnection as NetworkIcon,
  SystemShut as OsIcon,
  DataTransferBoth as IOIcon,
  Calendar as ActionIcon,
  NetworkAlt as PlacementIcon,
  Folder as ContextIcon,
  ElectronicsChip as NumaIcon
} from 'iconoir-react'

import { useAuth } from 'client/features/Auth'
import { Tr, Translate } from 'client/components/HOC'

import Tabs from 'client/components/Tabs'
import Storage from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/storage'
import Networking from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/networking'
import Placement from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/placement'
import ScheduleAction from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/scheduleAction'
import Booting from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting'
import Context from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/context'
import InputOutput from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/inputOutput'
import Numa from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/numa'

import { STEP_ID as GENERAL_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/General'
import { SCHEMA } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/schema'
import { getActionsAvailable as getSectionsAvailable } from 'client/models/Helper'
import { T } from 'client/constants'

export const STEP_ID = 'extra'

export const STEP_SECTION = [
  { id: 'storage', name: T.Storage, icon: DatastoreIcon, Content: Storage },
  { id: 'network', name: T.Network, icon: NetworkIcon, Content: Networking },
  { id: 'booting', name: T.OSBooting, icon: OsIcon, Content: Booting },
  { id: 'input_output', name: T.InputOrOutput, icon: IOIcon, Content: InputOutput },
  { id: 'context', name: T.Context, icon: ContextIcon, Content: Context },
  { id: 'sched_action', name: T.ScheduledAction, icon: ActionIcon, Content: ScheduleAction },
  { id: 'placement', name: T.Placement, icon: PlacementIcon, Content: Placement },
  { id: 'numa', name: T.Numa, icon: NumaIcon, Content: Numa }
]

const Content = ({ data, setFormData }) => {
  const theme = useTheme()
  const { watch, formState: { errors }, control } = useFormContext()
  const { view, getResourceView } = useAuth()

  const tabs = useMemo(() => {
    const hypervisor = watch(`${GENERAL_ID}.HYPERVISOR`)
    const dialog = getResourceView('VM-TEMPLATE')?.dialogs?.create_dialog
    const sectionsAvailable = getSectionsAvailable(dialog, hypervisor)

    return STEP_SECTION
      .filter(({ id }) => sectionsAvailable.includes(id))
      .map(({ Content, name, icon, ...section }, idx) => ({
        ...section,
        name,
        label: <Translate word={name} />,
        renderContent: <Content {...{ data, setFormData, hypervisor, control }} />,
        icon: errors[STEP_ID]?.[idx] ? (
          <WarningIcon color={theme.palette.error.main} />
        ) : icon
      }))
  }, [errors[STEP_ID], view, control])

  return tabs.length > 0 ? (
    <Tabs tabs={tabs} />
  ) : (
    <span>{Tr(T.Empty)}</span>
  )
}

const ExtraConfiguration = () => ({
  id: STEP_ID,
  label: T.AdvancedOptions,
  resolver: formData => {
    const hypervisor = formData?.[GENERAL_ID]?.HYPERVISOR
    return SCHEMA(hypervisor)
  },
  optionsValidate: { abortEarly: false },
  content: Content
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func
}

export default ExtraConfiguration
