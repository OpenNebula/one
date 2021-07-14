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
import * as React from 'react'
import PropTypes from 'prop-types'

import { useAuth } from 'client/features/Auth'

import Tabs from 'client/components/Tabs'
import { stringToCamelCase, stringToCamelSpace } from 'client/utils'

import Capacity from 'client/components/Tabs/Vm/Capacity'
import Configuration from 'client/components/Tabs/Vm/Configuration'
import Info from 'client/components/Tabs/Vm/Info'
import Log from 'client/components/Tabs/Vm/Log'
import Network from 'client/components/Tabs/Vm/Network'
import Placement from 'client/components/Tabs/Vm/Placement'
import SchedActions from 'client/components/Tabs/Vm/SchedActions'
import Snapshot from 'client/components/Tabs/Vm/Snapshot'
import Storage from 'client/components/Tabs/Vm/Storage'

const loadTab = tabName => ({
  capacity: Capacity,
  configuration: Configuration,
  info: Info,
  log: Log,
  network: Network,
  placement: Placement,
  schedActions: SchedActions,
  snapshot: Snapshot,
  storage: Storage
}[tabName])

const VmTabs = ({ data, handleRefetch }) => {
  const [tabsAvailable, setTabs] = React.useState(() => [])
  const { view, getResourceView } = useAuth()

  React.useEffect(() => {
    const infoTabs = getResourceView('VM')?.['info-tabs'] ?? {}

    setTabs(() => Object.entries(infoTabs)
      ?.filter(([_, { enabled } = {}]) => !!enabled)
      ?.map(([tabName, tabProps]) => {
        const nameSanitize = stringToCamelCase(tabName)
        const TabContent = loadTab(nameSanitize)

        return TabContent && {
          name: stringToCamelSpace(nameSanitize),
          renderContent:
            props => TabContent({ ...props, tabProps, handleRefetch })
        }
      })
      ?.filter(Boolean))
  }, [view])

  return <Tabs tabs={tabsAvailable} data={data} />
}

VmTabs.propTypes = {
  data: PropTypes.object.isRequired,
  handleRefetch: PropTypes.func
}

VmTabs.displayName = 'VmTabs'

export default VmTabs
