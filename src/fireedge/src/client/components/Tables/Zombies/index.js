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
import ZombieColumns from 'client/components/Tables/Zombies/columns'
import ZombieRow from 'client/components/Tables/Zombies/row'

const DEFAULT_DATA_CY = 'zombie'

/**
 * @param {object} props - Props
 * @returns {ReactElement} - Zombies table
 */
const ZombiesTable = (props) => {
  const { rootProps = {}, searchProps = {}, zombies, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const columns = useMemo(() => ZombieColumns, [])

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => zombies, [zombies])}
      rootProps={rootProps}
      searchProps={searchProps}
      getRowId={(row) => String(row.DEPLOY_ID)}
      RowComponent={ZombieRow}
      {...rest}
    />
  )
}

ZombiesTable.propTypes = { ...EnhancedTable.propTypes }
ZombiesTable.displayName = 'ZombiesTable'

export default ZombiesTable
