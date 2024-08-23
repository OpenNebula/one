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
import { useViews } from 'client/features/Auth'
import { useGetServiceQuery } from 'client/features/OneApi/service'
import { getAvailableInfoTabs } from 'client/models/Helper'

import Tabs from 'client/components/Tabs'
import Actions from 'client/components/Tabs/Service/SchedActions'
import Info from 'client/components/Tabs/Service/Info'
import Log from 'client/components/Tabs/Service/Log'
import Roles from 'client/components/Tabs/Service/Roles'

const getTabComponent = (tabName) =>
  ({
    info: Info,
    roles: Roles,
    log: Log,
    sched_actions: Actions,
  }[tabName])

const ServiceTabs = memo(({ id }) => {
  const { view, getResourceView } = useViews()
  const { isError, error, status, data } = useGetServiceQuery({ id })

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.SERVICE
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

ServiceTabs.propTypes = { id: PropTypes.string.isRequired }
ServiceTabs.displayName = 'ServiceTabs'

export default ServiceTabs
