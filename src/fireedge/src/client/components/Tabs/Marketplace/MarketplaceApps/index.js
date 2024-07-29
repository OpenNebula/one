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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'
import { MarketplaceAppsTable } from 'client/components/Tables'
import { useGetMarketplaceQuery } from 'client/features/OneApi/marketplace'
import { useHistory, generatePath } from 'react-router-dom'
import { PATH } from 'client/apps/sunstone/routesOne'
const _ = require('lodash')

/**
 * Renders marketplace apps tab showing the apps of the cluster.
 *
 * @param {object} props - Props
 * @param {string} props.id - Marketplace id
 * @returns {ReactElement} Marketplace apps tab
 */
const MarketplaceApps = ({ id }) => {
  // Get info about the marketplaceApps
  const { data: marketplace } = useGetMarketplaceQuery({ id })

  // Define function to get details of a marketplace app
  const history = useHistory()
  const handleRowClick = (rowId) => {
    history.push(
      generatePath(PATH.STORAGE.MARKETPLACE_APPS.DETAIL, { id: String(rowId) })
    )
  }

  // Get apps of the marketplace
  const apps = _.isEmpty(marketplace?.MARKETPLACEAPPS)
    ? []
    : Array.isArray(marketplace?.MARKETPLACEAPPS?.ID)
    ? marketplace?.MARKETPLACEAPPS?.ID
    : [marketplace?.MARKETPLACEAPPS?.ID]

  return (
    <div>
      <Stack
        display="grid"
        gap="1em"
        gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
        padding={{ sm: '0.8em' }}
      >
        <MarketplaceAppsTable
          disableRowSelect
          filterData={(dataToFilter) =>
            dataToFilter.filter((app) => _.includes(apps, app.ID))
          }
          onRowClick={(row) => handleRowClick(row.ID)}
        />
      </Stack>
    </div>
  )
}

MarketplaceApps.propTypes = {
  id: PropTypes.string,
}

MarketplaceApps.displayName = 'MarketplaceApps'

export default MarketplaceApps
