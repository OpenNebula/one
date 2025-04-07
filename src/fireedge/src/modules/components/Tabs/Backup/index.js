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
import { RESOURCE_NAMES } from '@ConstantsModule'
import { ImageAPI, useViews } from '@FeaturesModule'
import { getAvailableInfoTabs } from '@ModelsModule'
import { OpenNebulaLogo } from '@modules/components/Icons'
import { BaseTab as Tabs } from '@modules/components/Tabs'
import Increments from '@modules/components/Tabs/Backup/Increments'
import Info from '@modules/components/Tabs/Backup/Info'
import Vms from '@modules/components/Tabs/Backup/Vms'
import { Alert, Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'

const getTabComponent = (tabName) =>
  ({
    info: Info,
    vms: Vms,
    increments: Increments,
  }[tabName])

const BackupTabs = memo(({ id }) => {
  const { view, getResourceView } = useViews()
  const { isError, error, status, data } = ImageAPI.useGetImageQuery({ id })

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.BACKUP
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

  return (
    <Stack
      direction="row"
      sx={{ justifyContent: 'center', alignItems: 'center' }}
    >
      <OpenNebulaLogo width={150} height={150} spinner />
    </Stack>
  )
})

BackupTabs.propTypes = { id: PropTypes.string.isRequired }
BackupTabs.displayName = 'BackupTabs'

export default BackupTabs
