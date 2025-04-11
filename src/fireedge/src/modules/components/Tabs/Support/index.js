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
import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Alert, LinearProgress } from '@mui/material'

import { useViews, SupportAPI } from '@FeaturesModule'
import { getAvailableInfoTabs } from '@ModelsModule'
import { RESOURCE_NAMES } from '@ConstantsModule'

import { BaseTab as Tabs } from '@modules/components/Tabs'
import Info from '@modules/components/Tabs/Support/Info'
import Chat from '@modules/components/Tabs/Support/Comments'

const getTabComponent = (tabName) =>
  ({
    info: Info,
    comments: Chat,
  }[tabName])

const SupportTabs = memo(({ ticket }) => {
  const id = ticket?.id
  const { view, getResourceView } = useViews()
  const { isLoading, isError, error } = SupportAPI.useGetTicketCommentsQuery({
    id,
  })

  const tabsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.SUPPORT
    const infoTabs = getResourceView(resource)?.['info-tabs'] ?? {}

    return getAvailableInfoTabs(infoTabs, getTabComponent, id?.toString())
  }, [view, id])

  if (isError) {
    return (
      <Alert severity="error" variant="outlined">
        {error.data}
      </Alert>
    )
  }

  return isLoading ? (
    <LinearProgress sx={{ width: '100%' }} />
  ) : (
    <Tabs addBorder tabs={tabsAvailable} />
  )
})

SupportTabs.propTypes = { ticket: PropTypes.object }
SupportTabs.displayName = 'SupportTabs'

export default SupportTabs
