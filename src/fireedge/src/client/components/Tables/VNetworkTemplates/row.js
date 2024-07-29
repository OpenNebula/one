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
import PropTypes from 'prop-types'

import { Typography } from '@mui/material'
import { Cloud, Group, Lock, User } from 'iconoir-react'

import { rowStyles } from 'client/components/Tables/styles'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

import * as Helper from 'client/models/Helper'

const Row = ({ original, value, ...props }) => {
  const classes = rowStyles()
  const { ID, NAME, UNAME, GNAME, LOCK, REGTIME, PROVISION_ID } = value

  const time = Helper.timeFromMilliseconds(+REGTIME)
  const timeAgo = `registered ${time.toRelative()}`

  return (
    <div {...props} data-cy={`network-template-${ID}`}>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography noWrap component="span">
            {NAME}
          </Typography>
          <span className={classes.labels}>{LOCK && <Lock />}</span>
        </div>
        <div className={classes.caption}>
          <span title={time.toFormat('ff')}>{`#${ID} ${timeAgo}`}</span>
          <span title={`${Tr(T.Owner)}: ${UNAME}`}>
            <User />
            <span>{` ${UNAME}`}</span>
          </span>
          <span title={`${Tr(T.Group)}: ${GNAME}`}>
            <Group />
            <span>{` ${GNAME}`}</span>
          </span>
          {PROVISION_ID && (
            <span title={`${Tr(T.ProvisionId)}: #${PROVISION_ID}`}>
              <Cloud />
              <span>{` ${PROVISION_ID}`}</span>
            </span>
          )}
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
