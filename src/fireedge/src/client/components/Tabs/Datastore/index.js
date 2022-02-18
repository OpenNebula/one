/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { LinearProgress } from '@mui/material'

import { useViews } from 'client/features/Auth'
import { useGetDatastoreQuery } from 'client/features/OneApi/datastore'
import { getAvailableInfoTabs } from 'client/models/Helper'
import { RESOURCE_NAMES } from 'client/constants'

import Tabs from 'client/components/Tabs'
import Info from 'client/components/Tabs/Datastore/Info'

const getTabComponent = (tabName) =>
  ({
    info: Info,
  }[tabName])

const DatastoreTabs = memo(({ id }) => {
  const { view, getResourceView } = useViews()
  const { isLoading } = useGetDatastoreQuery({ id })

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.DATASTORE
    const infoTabs = getResourceView(resource)?.['info-tabs'] ?? {}

    return getAvailableInfoTabs(infoTabs, getTabComponent, id)
  }, [view])

  return isLoading ? (
    <LinearProgress color="secondary" sx={{ width: '100%' }} />
  ) : (
    <Tabs tabs={tabsAvailable ?? []} />
  )
})

DatastoreTabs.propTypes = { id: PropTypes.string.isRequired }
DatastoreTabs.displayName = 'DatastoreTabs'

export default DatastoreTabs
