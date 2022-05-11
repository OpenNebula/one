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
import { Typography, Stack, Chip } from '@mui/material'

import { VmsTable } from 'client/components/Tables'
import VmActions from 'client/components/Tables/Vms/actions'
import VmTabs from 'client/components/Tabs/Vm'
import SplitPane from 'client/components/SplitPane'
import MultipleTags from 'client/components/MultipleTags'

function VirtualMachines() {
  const [selectedRows, onSelectedRowsChange] = useState(() => [])
  const actions = VmActions()

  return (
    <SplitPane>
      <VmsTable
        onSelectedRowsChange={onSelectedRowsChange}
        globalActions={actions}
      />
      {selectedRows?.length > 0 && (
        <Stack overflow="auto" data-cy={'detail'}>
          {selectedRows?.length === 1 ? (
            <>
              <Typography color="text.primary" noWrap mb={1}>
                {`#${selectedRows[0]?.original.ID} | ${selectedRows[0]?.original.NAME}`}
              </Typography>
              <VmTabs id={selectedRows[0]?.original.ID} />
            </>
          ) : (
            <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
              <MultipleTags
                limitTags={10}
                tags={selectedRows?.map(
                  ({ original, id, toggleRowSelected }) => (
                    <Chip
                      key={id}
                      variant="outlined"
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
  )
}

export default VirtualMachines
