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
import { OpenNebulaLogo } from '@modules/components/Icons'
import { Alert, Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'

import { RESOURCE_NAMES } from '@ConstantsModule'
import { useViews, VrAPI } from '@FeaturesModule'
import { getAvailableInfoTabs } from '@ModelsModule'

import { BaseTab as Tabs } from '@modules/components/Tabs'
import SingleDetailActions from '@modules/components/Tabs/SingleDetailActions'
import Info from '@modules/components/Tabs/VirtualRouter/Info'
import VmInfo from '@modules/components/Tabs/VirtualRouter/Vms'

const getTabComponent = (tabName) =>
  ({
    info: Info,
    vms: VmInfo,
  }[tabName])

const VirtualRouterTabs = memo(({ id, singleActions }) => {
  const { view, getResourceView } = useViews()
  const { isError, error, status, data } = VrAPI.useGetVrQuery({
    id,
  })

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.VROUTER
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
    return (
      <>
        <SingleDetailActions
          selectedRows={data}
          singleActions={singleActions}
        />
        <Tabs addBorder tabs={tabsAvailable ?? []} />
      </>
    )
  }

  return (
    <Stack
      direction="row"
      sx={{ justifyContent: 'center', alignItems: 'center' }}
    >
      <OpenNebulaLogo width={150} height={150} spinner />
    </Stack>
  )
})

VirtualRouterTabs.propTypes = {
  id: PropTypes.string.isRequired,
  singleActions: PropTypes.func,
}
VirtualRouterTabs.displayName = 'VirtualRouterTabs'

export default VirtualRouterTabs
