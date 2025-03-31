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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useFormContext } from 'react-hook-form'
import {
  SystemShut as OsIcon,
  DataTransferBoth as IOIcon,
  Folder as ContextIcon,
  RefreshDouble as BackupIcon,
} from 'iconoir-react'

import InputOutput from '@modules/components/Forms/Vm/UpdateConfigurationForm/inputOutput'
import Booting from '@modules/components/Forms/Vm/UpdateConfigurationForm/booting'
import Context from '@modules/components/Forms/Vm/UpdateConfigurationForm/context'
import Backup from '@modules/components/Forms/Vm/UpdateConfigurationForm/backup'

import { BaseTab as Tabs } from '@modules/components/Tabs'
import { Translate } from '@modules/components/HOC'
import { T, HYPERVISORS } from '@ConstantsModule'

/**
 * @param {object} props - Component props
 * @param {HYPERVISORS} props.hypervisor - VM hypervisor
 * @param {object} props.oneConfig - OpenNEbula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @param {object} props.vm - VM template
 * @returns {ReactElement} Form content component
 */
const Content = ({ hypervisor, oneConfig, adminGroup, vm }) => {
  const {
    formState: { errors },
  } = useFormContext()

  const tabs = useMemo(
    () => [
      {
        id: 'booting',
        icon: OsIcon,
        label: <Translate word={T.OSAndCpu} />,
        renderContent: () => (
          <Booting
            hypervisor={hypervisor}
            oneConfig={oneConfig}
            adminGroup={adminGroup}
            vm={vm}
          />
        ),
        error: !!errors?.OS,
      },
      {
        id: 'input_output',
        icon: IOIcon,
        label: <Translate word={T.InputOrOutput} />,
        renderContent: () => (
          <InputOutput
            hypervisor={hypervisor}
            oneConfig={oneConfig}
            adminGroup={adminGroup}
          />
        ),
        error: ['GRAPHICS', 'INPUT'].some((id) => errors?.[id]),
      },
      {
        id: 'context',
        icon: ContextIcon,
        label: <Translate word={T.Context} />,
        renderContent: () => (
          <Context
            hypervisor={hypervisor}
            oneConfig={oneConfig}
            adminGroup={adminGroup}
          />
        ),
        error: !!errors?.CONTEXT,
      },
      {
        id: 'backup',
        icon: BackupIcon,
        label: <Translate word={T.Backup} />,
        renderContent: () => (
          <Backup oneConfig={oneConfig} adminGroup={adminGroup} />
        ),
        error: ['BACKUP_VOLATILE', 'FS_FREEZE', 'KEEP_LAST', 'MODE'].some(
          (id) => errors?.[`BACKUP_CONFIG.${id}`]
        ),
      },
    ],
    [errors, hypervisor]
  )

  return (
    <Tabs addBorder tabs={tabs} oneConfig={oneConfig} adminGroup={adminGroup} />
  )
}

Content.propTypes = {
  hypervisor: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  vm: PropTypes.object,
}

export default Content
