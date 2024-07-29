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
import { HomeShield } from 'iconoir-react'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import { StatusCircle } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import * as ZoneModel from 'client/models/Zone'

const Row = ({ original, value, ...props }) => {
  const classes = rowStyles()
  const { ID, NAME, ENDPOINT } = value

  const { color: stateColor, name: stateName } = ZoneModel.getState(original)

  return (
    <div {...props} data-cy={`zone-${ID}`}>
      <div className={classes.main}>
        <div className={classes.title}>
          <StatusCircle color={stateColor} tooltip={stateName} />
          <Typography noWrap component="span">
            {NAME}
          </Typography>
        </div>
        <div className={classes.caption}>
          <span>{`#${ID}`}</span>
          <span title={`${Tr(T.Endpoint)}: ${ENDPOINT}`}>
            <HomeShield />
            <span>{` ${ENDPOINT}`}</span>
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
