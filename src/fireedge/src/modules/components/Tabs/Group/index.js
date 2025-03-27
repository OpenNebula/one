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
import { useViews, GroupAPI } from '@FeaturesModule'
import { getAvailableInfoTabs } from '@ModelsModule'

import { BaseTab as Tabs } from '@modules/components/Tabs'
import Info from '@modules/components/Tabs/Group/Info'
import GroupUsersTab from '@modules/components/Tabs/Group/Users'
import generateQuotasInfoTab from '@modules/components/Tabs/Quota'
import generateAccountingInfoTab from '@modules/components/Tabs/Accounting'
import generateShowbackInfoTab from '@modules/components/Tabs/Showback'

const getTabComponent = (tabName) =>
  ({
    info: Info,
    user: GroupUsersTab,
    quota: generateQuotasInfoTab({ groups: true }),
    accounting: generateAccountingInfoTab({ groups: true }),
    showback: generateShowbackInfoTab({ groups: true }),
  }[tabName])

const GroupTabs = memo(({ id }) => {
  const { view, getResourceView } = useViews()
  const { isError, error, status, data } = GroupAPI.useGetGroupQuery({ id })

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.GROUP
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

GroupTabs.propTypes = { id: PropTypes.string.isRequired }
GroupTabs.displayName = 'GroupTabs'

export default GroupTabs
