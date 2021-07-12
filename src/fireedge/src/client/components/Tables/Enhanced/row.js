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
import * as React from 'react'
import PropTypes from 'prop-types'
import { Row as RowType } from 'react-table'

const Row = ({ row, handleClick }) => {
  /** @type {RowType} */
  const { getRowProps, cells, isSelected } = row

  const renderCell = React.useCallback(cell => (
    <div {...cell.getCellProps()} data-header={cell.column.Header}>
      {cell.render('Cell')}
    </div>
  ), [])

  return (
    <div {...getRowProps()}
      className={isSelected ? 'selected' : ''}
      onClick={handleClick}
    >
      {cells?.map(renderCell)}
    </div>
  )
}

Row.propTypes = {
  row: PropTypes.object,
  handleClick: PropTypes.func
}

Row.defaultProps = {
  row: {},
  handleClick: undefined
}

export default Row
