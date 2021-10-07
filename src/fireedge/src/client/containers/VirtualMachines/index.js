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
import { useState } from 'react'

import { Container, Box } from '@mui/material'

import { VmsTable } from 'client/components/Tables'
import VmActions from 'client/components/Tables/Vms/actions'
import VmTabs from 'client/components/Tabs/Vm'
import SplitPane from 'client/components/SplitPane'

function VirtualMachines () {
  const [selectedRows, onSelectedRowsChange] = useState([])
  const actions = VmActions()

  const getRowIds = () =>
    JSON.stringify(selectedRows?.map(row => row.id).join(', '), null, 2)

  return (
    <Box
      height={1}
      py={2}
      overflow='auto'
      display='flex'
      flexDirection='column'
      component={Container}
    >
      <SplitPane>
        <VmsTable
          onSelectedRowsChange={onSelectedRowsChange}
          globalActions={actions}
        />

        {selectedRows?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            {selectedRows?.length === 1
              ? <VmTabs id={selectedRows[0]?.values.ID} />
              : <pre><code>{getRowIds()}</code></pre>
            }
          </div>
        )}
      </SplitPane>
    </Box>
  )
}

export default VirtualMachines
