/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import PropTypes from 'prop-types'
import { ReactElement, useMemo } from 'react'
import { Table, Tag } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { prettyBytes, timeFromMilliseconds } from '@UtilsModule'
import { getBackupIncrements } from '@ModelsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @returns {ReactElement} - Backup increments tab
 */
export const Increments = ({ data }) => {
  const backup = [].concat(data?.selected).filter(Boolean)?.[0] ?? {}
  const increments = useMemo(() => getBackupIncrements(backup), [backup])

  const columns = useMemo(
    () => [
      {
        header: T.ID,
        id: 'id',
        accessorKey: 'ID',
        grow: false,
      },
      {
        header: T.Type,
        id: 'type',
        accessorKey: 'TYPE',
        grow: false,
        cell: ({ row }) =>
          row.original?.TYPE ? (
            <Tag title={row.original.TYPE} status="default" />
          ) : (
            '-'
          ),
      },
      {
        header: T.Date,
        id: 'date',
        grow: false,
        accessorFn: (row) =>
          row?.DATE ? timeFromMilliseconds(+row.DATE).toRelative() : '-',
      },
      {
        header: T.Size,
        id: 'size',
        grow: false,
        accessorFn: (row) => prettyBytes(row?.SIZE, 'MB'),
      },
      {
        header: T.Source,
        id: 'source',
        accessorKey: 'SOURCE',
        truncate: true,
      },
    ],
    []
  )

  return (
    <Table
      columns={columns}
      data={increments}
      isRowsSelectable={false}
      isEnableSearchBar={true}
      isEnableSort={true}
      isEnableFilters={true}
      isDisablePagination
    />
  )
}

Increments.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Increments.id = 'increments'
Increments.title = T.Increments

export default Increments
