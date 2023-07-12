/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { useViews } from 'client/features/Auth'
import { useGetVDCQuery } from 'client/features/OneApi/vdc'
import { getAvailableInfoTabs } from 'client/models/Helper'

import Tabs from 'client/components/Tabs'
import Datastores from 'client/components/Tabs/Vdc//Datastores'
import Groups from 'client/components/Tabs/Vdc//Groups'
import Hosts from 'client/components/Tabs/Vdc//Hosts'
import Info from 'client/components/Tabs/Vdc//Info'
import Vnets from 'client/components/Tabs/Vdc//Vnets'
import Clusters from 'client/components/Tabs/Vdc/Clusters'

const getTabComponent = (tabName) =>
  ({
    info: Info,
    groups: Groups,
    clusters: Clusters,
    hosts: Hosts,
    vnets: Vnets,
    datastores: Datastores,
  }[tabName])

const VDCTabs = memo(({ id }) => {
  const { view, getResourceView } = useViews()
  const { isError, error, status, data } = useGetVDCQuery({ id })

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.VDC
    const infoTabs = getResourceView(resource)?.['info-tabs'] ?? {}

    return getAvailableInfoTabs(infoTabs, getTabComponent, id)
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
VDCTabs.propTypes = { id: PropTypes.string.isRequired }
VDCTabs.displayName = 'VDCTabs'

export default VDCTabs
