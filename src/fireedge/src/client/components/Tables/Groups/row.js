/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'

import { Group } from 'iconoir-react'
import { Typography } from '@mui/material'

import { rowStyles } from 'client/components/Tables/styles'

const Row = ({ original, value, ...props }) => {
  const classes = rowStyles()
  const { ID, NAME, TOTAL_USERS } = value

  return (
    <div {...props} data-cy={`group-${ID}`}>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography noWrap component="span">
            {NAME}
          </Typography>
        </div>
        <div className={classes.caption}>
          <span>{`#${ID}`}</span>
          <span title={`Total Users: ${TOTAL_USERS}`}>
            <Group />
            <span>{` ${TOTAL_USERS}`}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

Row.propTypes = {
  original: PropTypes.object,
  value: PropTypes.object,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
}

export default Row
