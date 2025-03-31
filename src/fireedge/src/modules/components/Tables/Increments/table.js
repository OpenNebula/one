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
import { useMemo, ReactElement } from 'react'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import IncrementColumns from '@modules/components/Tables/Increments/columns'
import IncrementRow from '@modules/components/Tables/Increments/row'
import { useViews } from '@FeaturesModule'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import { timeToString } from '@ModelsModule'
import { prettyBytes } from '@UtilsModule'

const DEFAULT_DATA_CY = 'increments'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Backups table
 */
const IncrementsTable = (props) => {
  const { rootProps = {}, increments, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY

  const { view, getResourceView } = useViews()

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.BACKUP)?.filters,
        columns: IncrementColumns,
      }),
    [view]
  )

  const listHeader = [
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Type, id: 'id', accessor: 'TYPE' },
    {
      header: T.Date,
      id: 'id',
      accessor: (increment) => timeToString(increment?.DATE),
    },
    {
      header: T.Size,
      id: 'id',
      accessor: (increment) => prettyBytes(increment?.SIZE, 'MB'),
    },
    { header: T.Name, id: 'id', accessor: 'SOURCE' },
  ]

  const { component, header } = WrapperRow(IncrementRow)

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => increments, [increments])}
      rootProps={rootProps}
      getRowId={(row) => String(row.ID)}
      RowComponent={component}
      headerList={header && listHeader}
      {...rest}
    />
  )
}

IncrementsTable.propTypes = { ...EnhancedTable.propTypes }
IncrementsTable.displayName = 'IncrementsTable'

export default IncrementsTable
