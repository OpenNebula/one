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
import { TableCell, TableRow } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { SERVER_CONFIG } from 'client/constants'
import { useAuth } from 'client/features/Auth'
import get from 'lodash.get'
import PropTypes from 'prop-types'
import { ReactElement, memo } from 'react'

const listStyles = makeStyles(({ palette }) => ({
  row: {
    '&.selected': {
      boxShadow: `inset 0px -0.5px 0px 2px ${palette.secondary.main}`,
    },
  },
}))

/**
 * @param {object} props - Props
 * @returns {ReactElement} Generic Row
 */
const RowStyle = memo(
  ({
    original = {},
    value = {},
    onClickLabel,
    onDeleteLabel,
    globalErrors,
    headerList = [],
    className,
    rowDataCy = '',
    ...props
  }) => {
    const { ID = '' } = original
    const styles = listStyles()

    return (
      <TableRow
        data-cy={`list-${rowDataCy}-${ID}`}
        {...props}
        className={`${styles.row} ${className}`}
      >
        {headerList.map(({ id, accessor }) => {
          switch (typeof accessor) {
            case 'string':
              return <TableCell key={id}>{get(original, accessor)}</TableCell>
            case 'function':
              return <TableCell key={id}>{accessor(original, value)}</TableCell>
            default:
              return ''
          }
        })}
      </TableRow>
    )
  },
  (prev, next) => prev.className === next.className
)

RowStyle.propTypes = {
  original: PropTypes.object,
  value: PropTypes.object,
  onClickLabel: PropTypes.func,
  onDeleteLabel: PropTypes.func,
  globalErrors: PropTypes.array,
  headerList: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  rowDataCy: PropTypes.string,
  className: PropTypes.string,
}

RowStyle.displayName = 'RowStyle'

/**
 * @param {ReactElement} RowCardComponent - Standard row component (Card).
 * @returns {ReactElement} Generic Row
 */
const WrapperRow = (RowCardComponent) => {
  const { settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
  const { ROW_STYLE } = fireedge
  const { rowStyle } = SERVER_CONFIG

  const data = ROW_STYLE || rowStyle
  const header = data === 'list'

  return {
    component: header ? RowStyle : RowCardComponent,
    header,
  }
}

export default WrapperRow
