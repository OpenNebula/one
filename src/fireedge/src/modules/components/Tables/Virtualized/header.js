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
/* eslint-disable jsdoc/require-jsdoc */
import { useCallback } from 'react'
import PropTypes from 'prop-types'
import { UseTableInstanceProps } from 'react-table'

const Header = ({ useTableProps }) => {
  /** @type {UseTableInstanceProps} */
  const { headerGroups } = useTableProps

  const renderHeaderColumn = useCallback(
    (column) => (
      <div {...column.getHeaderProps()}>{column.render('Header')}</div>
    ),
    []
  )

  const renderHeaderGroup = useCallback(
    (headerGroup) => (
      <div {...headerGroup.getHeaderGroupProps()}>
        {headerGroup.headers.map(renderHeaderColumn)}
      </div>
    ),
    []
  )

  return headerGroups.map(renderHeaderGroup)
}

Header.propTypes = {
  useTableProps: PropTypes.object,
}

Header.defaultProps = {
  useTableProps: {},
}

export default Header
