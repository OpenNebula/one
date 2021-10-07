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
/* eslint-disable jsdoc/require-jsdoc */
import { memo, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { LinearProgress } from '@mui/material'

import { useFetch } from 'client/hooks'
import { useAuth } from 'client/features/Auth'
import { useUserApi } from 'client/features/One'

import Tabs from 'client/components/Tabs'
import { camelCase } from 'client/utils'

import TabProvider from 'client/components/Tabs/TabProvider'
import Info from 'client/components/Tabs/User/Info'

const getTabComponent = tabName => ({
  info: Info
}[tabName])

const UserTabs = memo(({ id }) => {
  const { getUser } = useUserApi()
  const { data, fetchRequest, loading, error } = useFetch(getUser)

  const handleRefetch = () => fetchRequest(id, { reload: true })

  const [tabsAvailable, setTabs] = useState(() => [])
  const { view, getResourceView } = useAuth()

  useEffect(() => {
    fetchRequest(id)
  }, [id])

  useEffect(() => {
    const infoTabs = getResourceView('USER')?.['info-tabs'] ?? {}

    setTabs(() => Object.entries(infoTabs)
      ?.filter(([_, { enabled } = {}]) => !!enabled)
      ?.map(([tabName, tabProps]) => {
        const camelName = camelCase(tabName)
        const TabContent = getTabComponent(camelName)

        return TabContent && {
          name: camelName,
          renderContent: props => TabContent({ ...props, tabProps })
        }
      })
      ?.filter(Boolean))
  }, [view])

  if ((!data && !error) || loading) {
    return <LinearProgress color='secondary' style={{ width: '100%' }} />
  }

  return (
    <TabProvider initialState={{ data, handleRefetch }}>
      <Tabs tabs={tabsAvailable} />
    </TabProvider>
  )
})

UserTabs.propTypes = {
  id: PropTypes.string.isRequired
}

UserTabs.displayName = 'UserTabs'

export default UserTabs
