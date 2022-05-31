/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { Alert, LinearProgress } from '@mui/material'

import { useViews } from 'client/features/Auth'
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
import Configuration from 'client/components/Tabs/Vm/Configuration'
import Template from 'client/components/Tabs/Vm/Template'

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
    configuration: Configuration,
    template: Template,
  }[tabName])

const VmTabs = memo(({ id }) => {
  const { view, getResourceView } = useViews()
  const { isLoading, isError, error } = useGetVmQuery(
    { id },
    { refetchOnMountOrArgChange: 10 }
  )

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.VM
    const infoTabs = getResourceView(resource)?.['info-tabs'] ?? {}

    return getAvailableInfoTabs(infoTabs, getTabComponent, id)
  }, [view])

  if (isError) {
    return (
      <Alert severity="error" variant="outlined">
        {error.data}
      </Alert>
    )
  }

  return isLoading ? (
    <LinearProgress color="secondary" sx={{ width: '100%' }} />
  ) : (
    <Tabs addBorder tabs={tabsAvailable} />
  )
})

VmTabs.propTypes = { id: PropTypes.string.isRequired }
VmTabs.displayName = 'VmTabs'

export default VmTabs
