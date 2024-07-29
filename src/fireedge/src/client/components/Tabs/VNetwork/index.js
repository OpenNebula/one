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
import { Alert, LinearProgress } from '@mui/material'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'

import { RESOURCE_NAMES } from 'client/constants'
import { useViews, useSystemData } from 'client/features/Auth'
import { useGetVNetworkQuery } from 'client/features/OneApi/network'
import { getAvailableInfoTabs } from 'client/models/Helper'

import Tabs from 'client/components/Tabs'
import Address from 'client/components/Tabs/VNetwork/Address'
import Clusters from 'client/components/Tabs/VNetwork/Clusters'
import Info from 'client/components/Tabs/VNetwork/Info'
import Lease from 'client/components/Tabs/VNetwork/Leases'
import Security from 'client/components/Tabs/VNetwork/Security'
import VRouters from 'client/components/Tabs/VNetwork/VRouters'

const getTabComponent = (tabName) =>
  ({
    info: Info,
    address: Address,
    lease: Lease,
    security: Security,
    virtual_router: VRouters,
    cluster: Clusters,
  }[tabName])

const VNetworkTabs = memo(({ id }) => {
  const { view, getResourceView } = useViews()
  const { isError, error, status, data } = useGetVNetworkQuery({
    id,
  })

  const { adminGroup, oneConfig } = useSystemData()

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.VNET
    const infoTabs = getResourceView(resource)?.['info-tabs'] ?? {}

    return getAvailableInfoTabs(
      infoTabs,
      getTabComponent,
      id,
      oneConfig,
      adminGroup
    )
  }, [view, id])

  if (isError) {
    return (
      <Alert severity="error" variant="outlined">
        {error.data}
      </Alert>
    )
  }

  if (status === 'fulfilled' || id === data?.ID) {
    return <Tabs addBorder tabs={tabsAvailable ?? []} />
  }

  return <LinearProgress color="secondary" sx={{ width: '100%' }} />
})
VNetworkTabs.propTypes = { id: PropTypes.string.isRequired }
VNetworkTabs.displayName = 'VNetworkTabs'

export default VNetworkTabs
