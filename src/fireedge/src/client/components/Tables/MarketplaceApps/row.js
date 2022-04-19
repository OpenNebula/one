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

import { Lock, User, Group, Cart } from 'iconoir-react'
import { Typography } from '@mui/material'

import { StatusCircle, StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as MarketplaceAppModel from 'client/models/MarketplaceApp'
import * as Helper from 'client/models/Helper'
import { prettyBytes } from 'client/utils'

const Row = ({ original, value, ...props }) => {
  const classes = rowStyles()
  const {
    ID,
    NAME,
    UNAME,
    GNAME,
    LOCK,
    TYPE,
    REGTIME,
    MARKETPLACE,
    ZONE_ID,
    SIZE,
  } = value

  const { color: stateColor, name: stateName } =
    MarketplaceAppModel.getState(original)

  const time = Helper.timeFromMilliseconds(+REGTIME)
  const timeAgo = `registered ${time.toRelative()}`

  return (
    <div {...props} data-cy={`app-${ID}`}>
      <div className={classes.main}>
        <div className={classes.title}>
          <StatusCircle color={stateColor} tooltip={stateName} />
          <Typography component="span">{NAME}</Typography>
          {LOCK && <Lock />}
          <span className={classes.labels}>
            <StatusChip text={TYPE} />
          </span>
        </div>
        <div className={classes.caption}>
          <span title={time.toFormat('ff')}>{`#${ID} ${timeAgo}`}</span>
          <span title={`Owner: ${UNAME}`}>
            <User />
            <span>{` ${UNAME}`}</span>
          </span>
          <span title={`Group: ${GNAME}`}>
            <Group />
            <span>{` ${GNAME}`}</span>
          </span>
          <span title={`Marketplace: ${MARKETPLACE}`}>
            <Cart />
            <span>{` ${MARKETPLACE}`}</span>
          </span>
        </div>
      </div>
      <div className={classes.secondary}>
        <span className={classes.labels}>
          <StatusChip text={`Zone ${ZONE_ID}`} />
          <StatusChip text={prettyBytes(+SIZE, 'MB')} />
        </span>
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
