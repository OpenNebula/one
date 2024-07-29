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
import { useGetImageQuery } from 'client/features/OneApi/image'
import { getAvailableInfoTabs } from 'client/models/Helper'

import Tabs from 'client/components/Tabs'
import Info from 'client/components/Tabs/Image/Info'
import Snapshots from 'client/components/Tabs/Image/Snapshots'
import Vms from 'client/components/Tabs/Image/Vms'

const getTabComponent = (tabName) =>
  ({
    info: Info,
    vms: Vms,
    snapshot: Snapshots,
  }[tabName])

const ImageTabs = memo(({ id }) => {
  const { view, getResourceView } = useViews()
  const { isError, error, status, data } = useGetImageQuery({ id })
  const { adminGroup, oneConfig } = useSystemData()

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.IMAGE
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

ImageTabs.propTypes = { id: PropTypes.string.isRequired }
ImageTabs.displayName = 'ImageTabs'

export default ImageTabs
