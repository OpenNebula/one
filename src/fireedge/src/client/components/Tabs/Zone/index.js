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
import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Alert, LinearProgress } from '@mui/material'

import { useViews } from 'client/features/Auth'
import { useGetZoneQuery } from 'client/features/OneApi/zone'
import { getAvailableInfoTabs } from 'client/models/Helper'
import { RESOURCE_NAMES } from 'client/constants'

import Tabs from 'client/components/Tabs'
import Info from 'client/components/Tabs/Zone/Info'

const getTabComponent = (tabName) =>
  ({
    info: Info,
  }[tabName])

const ZoneTabs = memo(({ id }) => {
  const { view, getResourceView } = useViews()
  const { isLoading, isError, error } = useGetZoneQuery(id)

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.ZONE
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
    <Tabs addBorder tabs={tabsAvailable ?? []} />
  )
})

ZoneTabs.propTypes = { id: PropTypes.string.isRequired }
ZoneTabs.displayName = 'ZoneTabs'

export default ZoneTabs
