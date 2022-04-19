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

import { User, Group, CloudDownload } from 'iconoir-react'
import { Typography } from '@mui/material'

import {
  StatusCircle,
  LinearProgressWithLabel,
  StatusChip,
} from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as MarketplaceModel from 'client/models/Datastore'

const Row = ({ original, value, ...props }) => {
  const classes = rowStyles()
  const { ID, NAME, UNAME, GNAME, MARKET_MAD, TOTAL_APPS } = value

  const { name: stateName, color: stateColor } =
    MarketplaceModel.getState(original)

  const { percentOfUsed, percentLabel } =
    MarketplaceModel.getCapacityInfo(value)

  return (
    <div {...props}>
      <div className={classes.main}>
        <div className={classes.title}>
          <StatusCircle color={stateColor} tooltip={stateName} />
          <Typography component="span">{NAME}</Typography>
          <span className={classes.labels}>
            <StatusChip text={MARKET_MAD} />
          </span>
        </div>
        <div className={classes.caption}>
          <span>{`#${ID}`}</span>
          <span title={`Owner: ${UNAME}`}>
            <User />
            <span>{` ${UNAME}`}</span>
          </span>
          <span title={`Group: ${GNAME}`}>
            <Group />
            <span>{` ${GNAME}`}</span>
          </span>
          <span title={`Total Apps: ${TOTAL_APPS}`}>
            <CloudDownload />
            <span>{` ${TOTAL_APPS}`}</span>
          </span>
        </div>
      </div>
      <div className={classes.secondary}>
        <LinearProgressWithLabel value={percentOfUsed} label={percentLabel} />
      </div>
    </div>
  )
}

Row.propTypes = {
  value: PropTypes.object,
  original: PropTypes.object,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
}

export default Row
