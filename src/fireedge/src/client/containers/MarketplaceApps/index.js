/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { useState, JSXElementConstructor } from 'react'
import { Container, Stack, Chip } from '@mui/material'

import { MarketplaceAppsTable } from 'client/components/Tables'
import MarketplaceAppActions from 'client/components/Tables/MarketplaceApps/actions'
import MarketplaceAppsTabs from 'client/components/Tabs/MarketplaceApp'
import SplitPane from 'client/components/SplitPane'
import MultipleTags from 'client/components/MultipleTags'

/**
 * Displays a Marketplace Apps list.
 *
 * @returns {JSXElementConstructor} List of Marketplace Apps
 */
function MarketplaceApps() {
  const [selectedRows, onSelectedRowsChange] = useState(() => [])
  const actions = MarketplaceAppActions()

  return (
    <Stack height={1} py={2} overflow="auto" component={Container}>
      <SplitPane>
        <MarketplaceAppsTable
          onSelectedRowsChange={onSelectedRowsChange}
          globalActions={actions}
        />

        {selectedRows?.length > 0 && (
          <Stack overflow="auto">
            {selectedRows?.length === 1 ? (
              <MarketplaceAppsTabs id={selectedRows[0]?.original.ID} />
            ) : (
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={1}
                alignItems="center"
              >
                <MultipleTags
                  limitTags={10}
                  tags={selectedRows?.map(
                    ({ original, id, toggleRowSelected }) => (
                      <Chip
                        key={id}
                        variant="text"
                        label={original?.NAME ?? id}
                        onDelete={() => toggleRowSelected(false)}
                      />
                    )
                  )}
                />
              </Stack>
            )}
          </Stack>
        )}
      </SplitPane>
    </Stack>
  )
}

export default MarketplaceApps
