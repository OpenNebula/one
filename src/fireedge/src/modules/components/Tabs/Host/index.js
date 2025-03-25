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
import { Alert, LinearProgress } from '@mui/material'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'

import { RESOURCE_NAMES } from '@ConstantsModule'
import { useViews, HostAPI } from '@FeaturesModule'
import { getAvailableInfoTabs } from '@ModelsModule'

import { BaseTab as Tabs } from '@modules/components/Tabs'
import Info from '@modules/components/Tabs/Host/Info'
import Graph from '@modules/components/Tabs/Host/Graphs'
import PCI from '@modules/components/Tabs/Host/PCI'
import Numa from '@modules/components/Tabs/Host/Numa'
import Vms from '@modules/components/Tabs/Host/Vms'
import Wilds from '@modules/components/Tabs/Host/Wilds'
import Zombies from '@modules/components/Tabs/Host/Zombies'

const getTabComponent = (tabName) =>
  ({
    info: Info,
    graphs: Graph,
    vms: Vms,
    wild: Wilds,
    numa: Numa,
    pci: PCI,
    zombies: Zombies,
  }[tabName])

const HostTabs = memo(({ id }) => {
  const { view, getResourceView } = useViews()
  const {
    isError,
    error,
    status,
    data = {},
  } = HostAPI.useGetHostQuery({ id }, { refetchOnMountOrArgChange: 10 })

  const { IM_MAD } = data

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.HOST
    const infoTabs = getResourceView(resource)?.['info-tabs'] ?? {}

    return getAvailableInfoTabs(infoTabs, getTabComponent, id)
  }, [view, id, IM_MAD])

  if (isError) {
    return (
      <Alert severity="error" variant="outlined">
        {error.data}
      </Alert>
    )
  }

  if (status === 'fulfilled' || id === data?.ID) {
    return <Tabs addBorder tabs={tabsAvailable} />
  }

  return <LinearProgress color="secondary" sx={{ width: '100%' }} />
})

HostTabs.propTypes = { id: PropTypes.string.isRequired }
HostTabs.displayName = 'HostTabs'

export default HostTabs
