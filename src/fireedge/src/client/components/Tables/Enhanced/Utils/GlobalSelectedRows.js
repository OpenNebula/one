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
import * as React from 'react'
import PropTypes from 'prop-types'

import { TableProps } from 'react-table'
import { makeStyles, Chip } from '@material-ui/core'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center'
  }
})

/**
 * Render all selected rows.
 *
 * @param {object} props - Props
 * @param {TableProps} props.useTableProps - Table props
 * @returns {React.JSXElementConstructor} Component JSX
 */
const GlobalSelectedRows = ({ useTableProps }) => {
  const classes = useStyles()

  const { preFilteredRows, state: { selectedRowIds } } = useTableProps
  const selectedRows = preFilteredRows.filter(row => !!selectedRowIds[row.id])

  return (
    <div className={classes.root}>
      {React.useMemo(() =>
        selectedRows?.map(({ original, id, toggleRowSelected }) => (
          <Chip key={id}
            label={original?.NAME ?? id}
            onDelete={() => toggleRowSelected(false)}
          />
        )),
      [selectedRows[0]?.id]
      )}
    </div>
  )
}

GlobalSelectedRows.propTypes = {
  useTableProps: PropTypes.object.isRequired
}

GlobalSelectedRows.displayName = ' GlobalSelectedRows'

export default GlobalSelectedRows
