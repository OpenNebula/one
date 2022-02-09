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

import { User, Group, Lock, HardDrive } from 'iconoir-react'
import { Stack, Typography } from '@mui/material'

import { StatusCircle } from 'client/components/Status'
import MultipleTags from 'client/components/MultipleTags'
import { rowStyles } from 'client/components/Tables/styles'

import * as VirtualMachineModel from 'client/models/VirtualMachine'
import * as Helper from 'client/models/Helper'

const Row = ({ original, value, ...props }) => {
  const classes = rowStyles()
  const {
    ID,
    NAME,
    UNAME,
    GNAME,
    IPS,
    STIME,
    ETIME,
    HOSTNAME = '--',
    LOCK,
  } = value

  const time = Helper.timeFromMilliseconds(+ETIME || +STIME)
  const timeAgo = `${+ETIME ? 'done' : 'started'} ${time.toRelative()}`

  const { color: stateColor, name: stateName } =
    VirtualMachineModel.getState(original)

  return (
    <div {...props} data-cy={`vm-${ID}`}>
      <div>
        <StatusCircle color={stateColor} tooltip={stateName} />
      </div>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography noWrap component="span">
            {NAME}
          </Typography>
          <span className={classes.labels}>
            {LOCK && <Lock data-cy="lock" />}
          </span>
        </div>
        <div className={classes.caption}>
          <span title={time.toFormat('ff')}>{`#${ID} ${timeAgo}`}</span>
          <span title={`Owner: ${UNAME}`}>
            <User />
            <span data-cy="uname">{` ${UNAME}`}</span>
          </span>
          <span title={`Group: ${GNAME}`}>
            <Group />
            <span data-cy="gname">{` ${GNAME}`}</span>
          </span>
          <span title={`Hostname: ${HOSTNAME}`}>
            <HardDrive />
            <span data-cy="hostname">{` ${HOSTNAME}`}</span>
          </span>
        </div>
      </div>
      {!!IPS?.length && (
        <div className={classes.secondary}>
          <Stack flexWrap="wrap" justifyContent="end" alignItems="center">
            <MultipleTags tags={IPS.split(',')} />
          </Stack>
        </div>
      )}
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
