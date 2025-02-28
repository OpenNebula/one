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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'

import { useHistory } from 'react-router'
import { generatePath } from 'react-router-dom'
import { Box } from '@mui/material'

import { useViews, VrAPI, VnAPI } from '@FeaturesModule'

import { VrsTable } from '@modules/components/Tables'
import { RESOURCE_NAMES } from '@ConstantsModule'
import { PATH } from '@modules/components'

const { VROUTER } = RESOURCE_NAMES

/**
 * Renders the list of virtual routers from a Virtual Network.
 *
 * @param {object} props - Props
 * @param {string} props.id - Virtual Network id
 * @returns {ReactElement} Virtual routers tab
 */
const VRoutersTab = ({ id }) => {
  const { push: redirectTo } = useHistory()
  const { data: vnet } = VnAPI.useGetVNetworkQuery({ id })

  const { view, hasAccessToResource } = useViews()
  const detailAccess = useMemo(() => hasAccessToResource(VROUTER), [view])

  const vrouters = [vnet?.VROUTERS?.ID ?? []].flat().map((vrId) => +vrId)

  const redirectToVRouter = (row) => {
    redirectTo(generatePath(PATH.INSTANCE.VROUTERS.DETAIL, { id: row.ID }))
  }

  const useQuery = () =>
    VrAPI.useGetVrsQuery(undefined, {
      selectFromResult: ({ data: result = [], ...rest }) => ({
        data: result?.filter((vrouter) => vrouters.includes(+vrouter.ID)),
        ...rest,
      }),
    })

  return (
    <Box padding={{ sm: '0.8em', overflow: 'auto' }}>
      <VrsTable.Table
        disableGlobalSort
        disableRowSelect
        pageSize={5}
        onRowClick={detailAccess ? redirectToVRouter : undefined}
        useQuery={useQuery}
      />
    </Box>
  )
}

VRoutersTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

VRoutersTab.displayName = 'VRoutersTab'

export default VRoutersTab
