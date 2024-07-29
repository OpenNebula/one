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

import EnhancedTable from 'client/components/Tables/Enhanced'
import WildColumns from 'client/components/Tables/Wilds/columns'
import WildRow from 'client/components/Tables/Wilds/row'

const DEFAULT_DATA_CY = 'wilds'

/**
 * @param {object} props - Props
 * @returns {ReactElement} - Wilds table
 */
const WildsTable = (props) => {
  const { rootProps = {}, searchProps = {}, wilds, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const columns = useMemo(() => WildColumns, [])

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => wilds, [wilds])}
      rootProps={rootProps}
      searchProps={searchProps}
      getRowId={(row) => String(row.DEPLOY_ID)}
      RowComponent={WildRow}
      {...rest}
    />
  )
}

WildsTable.propTypes = { ...EnhancedTable.propTypes }
WildsTable.displayName = 'WildsTable'

export default WildsTable
