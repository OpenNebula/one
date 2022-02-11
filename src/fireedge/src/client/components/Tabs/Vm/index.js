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
import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'
import { LinearProgress } from '@mui/material'

import { useAuth } from 'client/features/Auth'
import { useGetVmQuery } from 'client/features/OneApi/vm'
import { getAvailableInfoTabs } from 'client/models/Helper'
import { RESOURCE_NAMES } from 'client/constants'

import Tabs from 'client/components/Tabs'
import Capacity from 'client/components/Tabs/Vm/Capacity'
import Configuration from 'client/components/Tabs/Vm/Configuration'
import Info from 'client/components/Tabs/Vm/Info'
import Network from 'client/components/Tabs/Vm/Network'
import History from 'client/components/Tabs/Vm/History'
import SchedActions from 'client/components/Tabs/Vm/SchedActions'
import Snapshot from 'client/components/Tabs/Vm/Snapshot'
import Storage from 'client/components/Tabs/Vm/Storage'

const getTabComponent = (tabName) =>
  ({
    capacity: Capacity,
    configuration: Configuration,
    info: Info,
    network: Network,
    history: History,
    schedActions: SchedActions,
    snapshot: Snapshot,
    storage: Storage,
  }[tabName])

const VmTabs = memo(({ id }) => {
  const { view, getResourceView } = useAuth()
  const { isLoading } = useGetVmQuery(id)

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.VM
    const infoTabs = getResourceView(resource)?.['info-tabs'] ?? {}

    return getAvailableInfoTabs(infoTabs, getTabComponent, id)
  }, [view])

  return isLoading ? (
    <LinearProgress color="secondary" sx={{ width: '100%' }} />
  ) : (
    <Tabs tabs={tabsAvailable} />
  )
})

VmTabs.propTypes = { id: PropTypes.string.isRequired }
VmTabs.displayName = 'VmTabs'

export default VmTabs
