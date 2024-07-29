/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { useMemo, ReactElement } from 'react'
import PropTypes from 'prop-types'
import {
  InfoEmpty as InfoIcon,
  HardDrive as HostIcon,
  Folder as DatastoreIcon,
  NetworkAlt as NetworkIcon,
  Page as LogIcon,
} from 'iconoir-react'

import Tabs from 'client/components/Tabs'
import InfoTab from 'client/containers/Provisions/DialogInfo/info'
import DatastoresTab from 'client/containers/Provisions/DialogInfo/datastores'
import NetworksTab from 'client/containers/Provisions/DialogInfo/networks'
import HostsTab from 'client/containers/Provisions/DialogInfo/hosts'
import LogTab from 'client/containers/Provisions/DialogInfo/log'
import { T } from 'client/constants'

/**
 * Renders information about provision: infrastructures, log, etc.
 *
 * @param {object} props - Props
 * @param {string} props.id - Provision id
 * @returns {ReactElement} - Provision id
 */
const DialogInfo = ({ id }) => {
  const tabsAvailable = useMemo(
    () => [
      {
        name: 'info',
        label: T.Info,
        icon: InfoIcon,
        renderContent: () => <InfoTab id={id} />,
      },
      {
        name: 'datastores',
        label: T.Datastores,
        icon: DatastoreIcon,
        renderContent: () => <DatastoresTab id={id} />,
      },
      {
        name: 'networks',
        label: T.Networks,
        icon: NetworkIcon,
        renderContent: () => <NetworksTab id={id} />,
      },
      {
        name: 'hosts',
        label: T.Hosts,
        icon: HostIcon,
        renderContent: ({ setTab, logTabId }) => (
          <HostsTab id={id} setTab={setTab} logTabId={logTabId} />
        ),
      },
      {
        name: 'log',
        label: T.Log,
        icon: LogIcon,
        renderContent: () => <LogTab id={id} />,
      },
    ],
    []
  )

  return <Tabs tabs={tabsAvailable} tabsProps={{ sx: { minHeight: 70 } }} />
}

DialogInfo.propTypes = { id: PropTypes.string.isRequired }

export default DialogInfo
