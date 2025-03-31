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
import { OpenNebulaLogo } from '@modules/components/Icons'

import { RESOURCE_NAMES } from '@ConstantsModule'
import { useViews, UserAPI } from '@FeaturesModule'
import { getAvailableInfoTabs } from '@ModelsModule'
import { BaseTab as Tabs } from '@modules/components/Tabs'
import Info from '@modules/components/Tabs/User/Info'
import Group from '@modules/components/Tabs/User/Group'
import generateQuotasInfoTab from '@modules/components/Tabs/Quota'
import generateAccountingInfoTab from '@modules/components/Tabs/Accounting'
import generateShowbackInfoTab from '@modules/components/Tabs/Showback'
import Authentication from '@modules/components/Tabs/User/Authentication'

const getTabComponent = (tabName) =>
  ({
    info: Info,
    group: Group,
    quota: generateQuotasInfoTab({ groups: false }),
    accounting: generateAccountingInfoTab({ groups: false }),
    showback: generateShowbackInfoTab({ groups: false }),
    authentication: Authentication,
  }[tabName])

const UserTabs = memo(({ id }) => {
  const { view, getResourceView } = useViews()
  const { isError, error, status, data } = UserAPI.useGetUserQuery({ id })

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.USER
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

UserTabs.propTypes = { id: PropTypes.string.isRequired }
UserTabs.displayName = 'UserTabs'

export default UserTabs
