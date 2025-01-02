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

import { RESOURCE_NAMES } from '@ConstantsModule'
import { useViews, useSystemData, VnAPI } from '@FeaturesModule'
import { getAvailableInfoTabs } from '@ModelsModule'

import Tabs from '@modules/components/Tabs'
import Address from '@modules/components/Tabs/VNetwork/Address'
import Clusters from '@modules/components/Tabs/VNetwork/Clusters'
import Info from '@modules/components/Tabs/VNetwork/Info'
import Lease from '@modules/components/Tabs/VNetwork/Leases'
import Security from '@modules/components/Tabs/VNetwork/Security'
import VRouters from '@modules/components/Tabs/VNetwork/VRouters'

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
  const { isError, error, status, data } = VnAPI.useGetVNetworkQuery({
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
