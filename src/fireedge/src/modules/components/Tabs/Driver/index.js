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
import { Alert, Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'

import { RESOURCE_NAMES } from '@ConstantsModule'
import { DriverAPI, useViews } from '@FeaturesModule'
import { getAvailableInfoTabs } from '@ModelsModule'

import { OpenNebulaLogo } from '@modules/components/Icons'
import { BaseTab as Tabs } from '@modules/components/Tabs'
import Info from '@modules/components/Tabs/Driver/Info'
import ConnectionTab from '@modules/components/Tabs/Driver/Connection'
import DeploymentConfsTab from '@modules/components/Tabs/Driver/DeploymentConfs'
import UserInputsTab from '@modules/components/Tabs/Driver/UserInputs'
import SingleDetailActions from '@modules/components/Tabs/SingleDetailActions'

const getTabComponent = (tabName) =>
  ({
    info: Info,
    connection: ConnectionTab,
    deployment_confs: DeploymentConfsTab,
    user_inputs: UserInputsTab,
  }[tabName])

const DriverTabs = memo(({ name, singleActions }) => {
  const { view, getResourceView } = useViews()
  const {
    isError,
    error,
    status,
    data = {},
  } = DriverAPI.useGetDriverQuery(
    { name: name?.toLowerCase() },
    { refetchOnMountOrArgChange: 10 }
  )

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.DRIVER
    const infoTabs = getResourceView(resource)?.['info-tabs'] ?? {}

    return getAvailableInfoTabs(infoTabs, getTabComponent, name)
  }, [view, name])

  if (isError) {
    return (
      <Alert severity="error" variant="outlined">
        {error.data}
      </Alert>
    )
  }

  if (status === 'fulfilled' || name === data?.name) {
    return (
      <>
        <SingleDetailActions
          selectedRows={data}
          singleActions={singleActions}
        />
        <Tabs addBorder tabs={tabsAvailable} />
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

DriverTabs.propTypes = {
  name: PropTypes.string.isRequired,
  singleActions: PropTypes.func,
}
DriverTabs.displayName = 'DriverTabs'

export default DriverTabs
