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
import { memo, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { LinearProgress } from '@mui/material'

import { useFetch, useSocket } from 'client/hooks'
import { useAuth } from 'client/features/Auth'
import { useVmApi } from 'client/features/One'

import Tabs from 'client/components/Tabs'
import { camelCase } from 'client/utils'

import TabProvider from 'client/components/Tabs/TabProvider'
import Capacity from 'client/components/Tabs/Vm/Capacity'
import Configuration from 'client/components/Tabs/Vm/Configuration'
import Info from 'client/components/Tabs/Vm/Info'
import Log from 'client/components/Tabs/Vm/Log'
import Network from 'client/components/Tabs/Vm/Network'
import Placement from 'client/components/Tabs/Vm/Placement'
import SchedActions from 'client/components/Tabs/Vm/SchedActions'
import Snapshot from 'client/components/Tabs/Vm/Snapshot'
import Storage from 'client/components/Tabs/Vm/Storage'

const getTabComponent = tabName => ({
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

const VmTabs = memo(({ id }) => {
  const { getHooksSocket } = useSocket()
  const { getVm } = useVmApi()

  const {
    data,
    fetchRequest,
    loading,
    error
  } = useFetch(getVm, getHooksSocket({ resource: 'vm', id }))

  const handleRefetch = () => fetchRequest(id, { reload: true })

  const [tabsAvailable, setTabs] = useState(() => [])
  const { view, getResourceView } = useAuth()

  useEffect(() => {
    fetchRequest(id)
  }, [id])

  useEffect(() => {
    const infoTabs = getResourceView('VM')?.['info-tabs'] ?? {}

    setTabs(() => Object.entries(infoTabs)
      ?.filter(([_, { enabled } = {}]) => !!enabled)
      ?.map(([tabName, tabProps]) => {
        const camelName = camelCase(tabName)
        const TabContent = getTabComponent(camelName)

        return TabContent && {
          name: camelName,
          renderContent: props => TabContent({ ...props, tabProps })
        }
      })
      ?.filter(Boolean))
  }, [view])

  if ((!data && !error) || loading) {
    return <LinearProgress color='secondary' style={{ width: '100%' }} />
  }

  return (
    <TabProvider initialState={{ data, handleRefetch }}>
      <Tabs tabs={tabsAvailable} />
    </TabProvider>
  )
})

VmTabs.propTypes = {
  id: PropTypes.string.isRequired
}

VmTabs.displayName = 'VmTabs'

export default VmTabs
