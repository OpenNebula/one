/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { OneKsAPI, useViews } from '@FeaturesModule'
import { getAvailableInfoTabs } from '@ModelsModule'

import { BaseTab as Tabs } from '@modules/components/Tabs'
import Kubeconfig from '@modules/components/Tabs/OneKs/Kubeconfig'
import NodeGroups from '@modules/components/Tabs/OneKs/NodeGroups'
import Info from '@modules/components/Tabs/OneKs/Info'
import Logs from '@modules/components/Tabs/OneKs/Logs'
import Events from '@modules/components/Tabs/OneKs/Events'
import SingleDetailActions from '@modules/components/Tabs/SingleDetailActions'

const getTabComponent = (tabName) =>
  ({
    info: Info,
    nodegroup: NodeGroups,
    logs: Logs,
    events: Events,
    kubeconfig: Kubeconfig,
  }[tabName])

const OneKsTabs = memo(({ id, singleActions }) => {
  const { view, getResourceView } = useViews()
  const { isError, error, status, data } = OneKsAPI.useGetOneKsClusterQuery({
    id,
    expand: true,
  })

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.ONEKS
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

  const oneKsData = data?.DOCUMENT ?? {}

  if (status === 'fulfilled' || id === oneKsData.ID) {
    return (
      <>
        <SingleDetailActions
          selectedRows={oneKsData}
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

OneKsTabs.propTypes = {
  id: PropTypes.string.isRequired,
  singleActions: PropTypes.array.isRequired,
}
OneKsTabs.displayName = 'OneKsTabs'
export default OneKsTabs
