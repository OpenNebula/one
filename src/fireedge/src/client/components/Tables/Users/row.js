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
import PropTypes from 'prop-types'

import { Group, Lock, LockKey } from 'iconoir-react'
import { Typography } from '@mui/material'

import { rowStyles } from 'client/components/Tables/styles'

const Row = ({ original, value, ...props }) => {
  const classes = rowStyles()
  const { ID, NAME, GNAME, ENABLED, AUTH_DRIVER } = value

  return (
    <div {...props} data-cy={`user-${ID}`}>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography component="span">{NAME}</Typography>
          <span className={classes.labels}>{!+ENABLED && <Lock />}</span>
        </div>
        <div className={classes.caption}>
          <span>{`#${ID}`}</span>
          <span title={`Group: ${GNAME}`}>
            <Group />
            <span>{` ${GNAME}`}</span>
          </span>
          <span title={`Auth Driver: ${AUTH_DRIVER}`}>
            <LockKey />
            <span>{` ${AUTH_DRIVER}`}</span>
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
