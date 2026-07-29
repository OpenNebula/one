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
import {
  Folder as ContextIcon,
  DataTransferBoth as IOIcon,
  SystemShut as OsIcon,
} from 'iconoir-react'
import PropTypes from 'prop-types'
import { ReactElement, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import Booting from '@modules/resources/resources/VirtualMachine/Forms/UpdateConfigurationForm/booting'
import Context from '@modules/resources/resources/VirtualMachine/Forms/UpdateConfigurationForm/context'
import InputOutput from '@modules/resources/resources/VirtualMachine/Forms/UpdateConfigurationForm/inputOutput'

import { HYPERVISORS, T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import { Tabs } from '@ComponentsV2Module'
import { Box } from '@mui/material'

const TABS_CONTAINER_SX = {
  display: 'flex',
  justifyContent: 'flex-start',
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

/**
 * @param {object} props - Component props
 * @param {HYPERVISORS} props.hypervisor - VM hypervisor
 * @param {object} props.oneConfig - OpenNEbula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @param {object} props.vm - VM template
 * @returns {ReactElement} Form content component
 */
const Content = ({ hypervisor, oneConfig, adminGroup, vm }) => {
  const { translate } = useTranslation()
  const {
    formState: { errors },
  } = useFormContext()

  const hasContext = !!vm?.TEMPLATE?.CONTEXT
  const [selected, setSelected] = useState(0)

  const tabs = useMemo(
    () => [
      {
        id: 'booting',
        icon: OsIcon,
        title: translate(T.OSAndCpu),
        Content: () => (
          <Booting
            hypervisor={hypervisor}
            oneConfig={oneConfig}
            adminGroup={adminGroup}
            vm={vm}
          />
        ),
        getError: (error) => !!error?.OS,
      },
      {
        id: 'input_output',
        icon: IOIcon,
        title: translate(T.InputOrOutput),
        Content: () => (
          <InputOutput
            hypervisor={hypervisor}
            oneConfig={oneConfig}
            adminGroup={adminGroup}
          />
        ),
        getError: (error) => ['GRAPHICS', 'INPUT'].some((id) => error?.[id]),
      },
      {
        id: 'context',
        icon: ContextIcon,
        title: translate(T.Context),
        tooltip: !hasContext ? T.NoContextInVm : undefined,
        disabled: !hasContext,
        Content: () => (
          <Context
            hypervisor={hypervisor}
            oneConfig={oneConfig}
            adminGroup={adminGroup}
          />
        ),
        getError: (error) => !!error?.CONTEXT,
      },
    ],
    [adminGroup, hasContext, hypervisor, oneConfig, vm, translate]
  )

  const ActiveTab = tabs[selected] ?? tabs[0]

  return (
    <Box sx={{ height: 'auto', overflow: 'visible' }}>
      <Box sx={TABS_CONTAINER_SX}>
        <Box sx={TABS_BREAKOUT_SX}>
          <Tabs
            type="line"
            defaultSelect={0}
            options={tabs.map(({ title, icon, getError, disabled }, idx) => ({
              title,
              startIcon: icon,
              error: !!getError?.(errors),
              value: idx,
              disabled,
            }))}
            onChange={(idx) => setSelected(idx)}
          />
        </Box>
      </Box>
      {ActiveTab && (
        <Box
          key={`tab-${ActiveTab.id ?? ActiveTab.title}`}
          data-cy={`tab-content-${ActiveTab.id ?? ActiveTab.title}`}
          sx={TAB_CONTENT_SX}
        >
          <ActiveTab.Content />
        </Box>
      )}
    </Box>
  )
}

Content.propTypes = {
  hypervisor: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  vm: PropTypes.object,
}

export default Content
