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
import { SystemShut as OsIcon } from 'iconoir-react'
import PropTypes from 'prop-types'
import { useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { useViews } from '@FeaturesModule'
import { getActionsAvailable as getSectionsAvailable } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

import { TabType } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration'
import BootOrder from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/booting/bootOrder'
import Networking from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/networking'
import Placement from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/placement'
import Scheduling from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/scheduleAction'
import Storage from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/storage'
import Pci from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/pci'
import { Box } from '@mui/material'
import { Tabs } from '@ComponentsV2Module'

import { RESOURCE_NAMES, T, VmTemplate } from '@ConstantsModule'

import { SCHEMA } from '@modules/resources/resources/VmTemplate/Forms/InstantiateForm/Steps/ExtraConfiguration/schema'

export const STEP_ID = 'extra'

/** @type {TabType[]} */
export const TABS = [
  Storage,
  Networking,
  Pci,
  Placement,
  Scheduling,
  {
    id: 'booting',
    name: T.OSBooting,
    icon: OsIcon,
    Content: BootOrder,
    getError: (error) => !!error?.OS,
  },
]

const TABS_CONTAINER_SX = {
  display: 'flex',
  justifyContent: 'center',
  overflow: 'visible',
  width: '100%',
}

const TABS_BREAKOUT_SX = {
  flex: '0 0 auto',
  maxWidth: 'none',
  width: 'max-content',
}

const TAB_CONTENT_SX = {
  height: 'auto',
  display: 'flex',
  flexDirection: 'column',
}

const Content = ({
  data,
  setFormData,
  hypervisor,
  oneConfig,
  adminGroup,
  vmTemplate,
}) => {
  const { translate } = useTranslation()
  const {
    formState: { errors },
    control,
  } = useFormContext()
  const { view, getResourceView } = useViews()
  const [selected, setSelected] = useState(0)

  const sectionsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.VM_TEMPLATE
    const dialog = getResourceView(resource)?.dialogs?.instantiate_dialog

    return getSectionsAvailable(dialog, hypervisor)
  }, [view])

  const stepErrors = errors[STEP_ID]

  const tabs = useMemo(
    () =>
      TABS.filter(({ id }) => sectionsAvailable.includes(id)).map(
        ({ Content: TabContent, name, getError, icon, ...section }) => ({
          ...section,
          name,
          title: translate(name),
          startIcon: icon,
          getError,
          Content: () => (
            <TabContent
              {...{
                data,
                setFormData,
                hypervisor,
                control,
                oneConfig,
                adminGroup,
                vmTemplate,
              }}
            />
          ),
        })
      ),
    [view, control, translate]
  )

  const ActiveTab = tabs[selected] ?? tabs[0]

  return (
    <Box sx={{ height: 'auto', overflow: 'visible' }}>
      <Box sx={TABS_CONTAINER_SX}>
        <Box sx={TABS_BREAKOUT_SX}>
          <Tabs
            type="line"
            defaultSelect={0}
            options={tabs.map(({ id, title, startIcon, getError }, idx) => ({
              id,
              title,
              startIcon,
              error: !!getError?.(stepErrors),
              value: idx,
            }))}
            onChange={(idx) => setSelected(idx)}
          />
        </Box>
      </Box>
      {ActiveTab && (
        <Box
          key={`tab-${ActiveTab.id ?? ActiveTab.name}`}
          data-cy={`tab-content-${ActiveTab.id ?? ActiveTab.name}`}
          sx={TAB_CONTENT_SX}
        >
          <ActiveTab.Content />
        </Box>
      )}
    </Box>
  )
}

/**
 * Optional configuration about VM Template.
 *
 * @param {VmTemplate} vmTemplate - VM Template
 * @returns {object} Optional configuration step
 */
const ExtraConfiguration = ({ vmTemplate, oneConfig, adminGroup }) => {
  const hypervisor = vmTemplate?.TEMPLATE?.HYPERVISOR

  return {
    id: STEP_ID,
    label: T.AdvancedOptions,
    resolver: SCHEMA,
    optionsValidate: { abortEarly: false },
    content: (props) =>
      Content({
        ...props,
        hypervisor,
        oneConfig,
        adminGroup,
        instantiate: true,
        vmTemplate: vmTemplate,
      }),
  }
}

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  vmTemplate: PropTypes.any,
}

export default ExtraConfiguration
