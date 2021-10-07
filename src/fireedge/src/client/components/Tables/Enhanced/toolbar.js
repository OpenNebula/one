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
import { JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'

import { useMediaQuery } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { UseTableInstanceProps, UseRowSelectState, UseFiltersInstanceProps } from 'react-table'

import { GlobalActions, GlobalSelectedRows, GlobalSort } from 'client/components/Tables/Enhanced/Utils'

const useToolbarStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
    gap: '1em'
  }
})

/**
 * @param {object} props - Props
 * @param {object} props.globalActions - Global actions
 * @param {object} props.onlyGlobalSelectedRows - Show only the selected rows
 * @param {UseTableInstanceProps} props.useTableProps - Table props
 * @returns {JSXElementConstructor} Returns table toolbar
 */
const Toolbar = ({ globalActions, onlyGlobalSelectedRows, useTableProps }) => {
  const classes = useToolbarStyles()
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const isSmallDevice = useMediaQuery(theme => theme.breakpoints.down('md'))

  /** @type {UseRowSelectState} */
  const { selectedRowIds } = useTableProps?.state ?? {}

  /** @type {UseFiltersInstanceProps} */
  const { preFilteredRows } = useTableProps ?? {}

  const selectedRows = preFilteredRows.filter(row => !!selectedRowIds[row.id])

  if (onlyGlobalSelectedRows) {
    return <GlobalSelectedRows useTableProps={useTableProps} />
  }

  return isMobile ? null : (
    <div className={classes.root}>
      {globalActions?.length > 0 && (
        <GlobalActions globalActions={globalActions} selectedRows={selectedRows} />
      )}
      {!isSmallDevice && <GlobalSort useTableProps={useTableProps} />}
    </div>
  )
}

Toolbar.propTypes = {
  globalActions: PropTypes.array,
  onlyGlobalSelectedRows: PropTypes.bool,
  useTableProps: PropTypes.object
}

export default Toolbar
