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

import GroupUsersTab from '@modules/resources/Tabs/Group/Users'
import Info from '@modules/resources/Tabs/Group/Info'
import PropTypes from 'prop-types'
import SingleDetailActions from '@modules/resources/Tabs/SingleDetailActions'
import VLANRules from '@modules/resources/resources/Group/Tabs/VLANRules'
import generateAccountingInfoTab from '@modules/resources/Tabs/Accounting'
import generateQuotasInfoTab from '@modules/resources/Tabs/Quota'
import generateShowbackInfoTab from '@modules/resources/Tabs/Showback'
import { Alert, Stack } from '@mui/material'
import { BaseTab as Tabs } from '@modules/resources/Tabs'
import { GroupAPI, useViews } from '@FeaturesModule'
import { OpenNebulaLogo } from '@modules/resources/Icons'
import { RESOURCE_NAMES } from '@ConstantsModule'
import { getAvailableInfoTabs } from '@UtilsModule'
import { memo, useMemo } from 'react'

const getTabComponent = (tabName) =>
  ({
    info: Info,
    user: GroupUsersTab,
    vlanrules: VLANRules,
    quota: generateQuotasInfoTab({ groups: true }),
    accounting: generateAccountingInfoTab({ groups: true }),
    showback: generateShowbackInfoTab({ groups: true }),
  }[tabName])

const GroupTabs = memo(({ id, singleActions }) => {
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
    return (
      <>
        <SingleDetailActions
          selectedRows={data}
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

GroupTabs.propTypes = {
  id: PropTypes.string.isRequired,
  singleActions: PropTypes.func,
}
GroupTabs.displayName = 'GroupTabs'

export default GroupTabs
