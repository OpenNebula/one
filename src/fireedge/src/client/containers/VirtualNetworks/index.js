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
/* eslint-disable jsdoc/require-jsdoc */
import { useState } from 'react'
import { Container, Stack, Chip } from '@mui/material'

import { VNetworksTable } from 'client/components/Tables'
import VNetworkTabs from 'client/components/Tabs/VNetwork'
import SplitPane from 'client/components/SplitPane'
import MultipleTags from 'client/components/MultipleTags'

function VirtualNetworks() {
  const [selectedRows, onSelectedRowsChange] = useState(() => [])

  return (
    <Stack height={1} py={2} overflow="auto" component={Container}>
      <SplitPane>
        <VNetworksTable onSelectedRowsChange={onSelectedRowsChange} />

        {selectedRows?.length > 0 && (
          <Stack overflow="auto" data-cy={'detail'}>
            {selectedRows?.length === 1 ? (
              <VNetworkTabs id={selectedRows[0]?.original.ID} />
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

export default VirtualNetworks
