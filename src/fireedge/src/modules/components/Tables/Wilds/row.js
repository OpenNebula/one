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
import PropTypes from 'prop-types'
import { useMemo, memo, ReactElement } from 'react'
import { useTheme, Typography } from '@mui/material'
import { rowStyles } from '@modules/components/Tables/styles'
import { Row as RowType } from 'react-table'

/**
 * @param {RowType} props - Props
 * @param {object} props.original - Wild
 * @param {boolean} props.isSelected - Wild selection
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
      <div data-cy={`wild-${DEPLOY_ID}`} {...props}>
        <div className={classes.main}>
          <div className={classes.title}>
            <Typography noWrap component="span">
              {VM_NAME}
            </Typography>
          </div>
          <div className={classes.caption}>
            <span>{`#${DEPLOY_ID}`}</span>
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

Row.displayName = 'WildsRow'

export default Row
