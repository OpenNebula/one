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
import { useMemo, ReactElement } from 'react'

import EnhancedTable, { createColumns } from 'client/components/Tables/Enhanced'
import IncrementColumns from 'client/components/Tables/Increments/columns'
import IncrementRow from 'client/components/Tables/Increments/row'

const DEFAULT_DATA_CY = 'increments'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Backups table
 */
const IncrementsTable = (props) => {
  const { rootProps = {}, increments, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY

  const columns = createColumns({
    columns: IncrementColumns,
  })

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => increments, [increments])}
      rootProps={rootProps}
      getRowId={(row) => String(row.ID)}
      RowComponent={IncrementRow}
      {...rest}
    />
  )
}

IncrementsTable.displayName = 'IncrementsTable'

export default IncrementsTable
