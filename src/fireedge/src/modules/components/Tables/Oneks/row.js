/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { Typography, useTheme } from '@mui/material'
import { XrayView as KubernetesIcon } from 'iconoir-react'

import { useMemo } from 'react'
import { rowStyles } from '@modules/components/Tables/styles'

import { Tr } from '@modules/components/HOC'
import { T } from '@ConstantsModule'
import { StatusCircle } from '@modules/components/Status'
import { timeFromMilliseconds, getVirtualOneKsState } from '@ModelsModule'
import Timer from '@modules/components/Timer'

const Row = ({
  original,
  value,
  headerList,
  rowDataCy,
  isSelected,
  toggleRowSelected,
  ...props
}) => {
  const theme = useTheme()
  const classes = useMemo(() => rowStyles(theme), [theme])
  const { ID, NAME, CREATED, VERSION } = value
  const [time, timeFormat] = useMemo(() => {
    const fromMill = timeFromMilliseconds(+CREATED)

    return [fromMill, fromMill.toFormat('ff')]
  }, [CREATED])

  const { color: stateColor, name: stateName } = getVirtualOneKsState(original)

  return (
    <div data-cy={`oneks-${ID}`} {...props}>
      <div className={classes.main}>
        <div className={classes.title}>
          <StatusCircle color={stateColor} tooltip={stateName} />
          <Typography noWrap component="span" data-cy="oneks-card-name">
            {NAME}
          </Typography>
        </div>
        <div className={classes.caption}>
          <span data-cy="oneks-card-id">{`#${ID}`}</span>
          <span title={timeFormat}>
            <Timer initial={time} />
          </span>
          {!!VERSION && (
            <span title={`${Tr(T.Version)}: ${VERSION}`}>
              <KubernetesIcon />
              <span>{` ${VERSION}`}</span>
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
  headerList: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  rowDataCy: PropTypes.string,
  toggleRowSelected: PropTypes.func,
}

export default Row
