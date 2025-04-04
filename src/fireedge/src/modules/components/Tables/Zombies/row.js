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
import { rowStyles } from '@modules/components/Tables/styles'
import { Typography, useTheme } from '@mui/material'
import { Row as RowType } from 'opennebula-react-table'
import PropTypes from 'prop-types'
import { memo, ReactElement, useMemo } from 'react'

/**
 * @param {RowType} props - Props
 * @param {object} props.original - Zombie
 * @param {boolean} props.isSelected - Zombie selection
 * @param {Function} props.handleClick - Action by click
 * @returns {ReactElement} - Table row
 */
const Row = memo(
  ({
    original,
    headerList,
    rowDataCy,
    isSelected,
    toggleRowSelected,
    ...props
  }) => {
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])
    const { DEPLOY_ID, VM_NAME } = original

    return (
      <div data-cy={`zombie-${DEPLOY_ID}`} {...props}>
        <div className={classes.main}>
          <div className={classes.title}>
            <Typography noWrap component="span">
              {VM_NAME}
            </Typography>
          </div>
        </div>
      </div>
    )
  }
)

Row.propTypes = {
  original: PropTypes.object,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  headerList: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  rowDataCy: PropTypes.string,
  toggleRowSelected: PropTypes.func,
}

Row.displayName = 'ZombiesRow'

export default Row
