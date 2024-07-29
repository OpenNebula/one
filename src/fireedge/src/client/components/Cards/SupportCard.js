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
import { ReactElement, memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Typography } from '@mui/material'

import { StatusCircle } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'
import { getState } from 'client/models/Support'
import {
  isoDateToMilliseconds,
  timeFromMilliseconds,
} from 'client/models/Helper'

import Timer from 'client/components/Timer'
import { T, Ticket } from 'client/constants'

const SupportCard = memo(
  /**
   * @param {object} props - Props
   * @param {Ticket} props.ticket - Support ticket resource
   * @param {object} props.rootProps - Props to root component
   * @returns {ReactElement} - Card
   */
  ({ ticket, rootProps }) => {
    const classes = rowStyles()
    const { color: stateColor, name: stateName } = getState(ticket)
    const { id, subject, created_at: createdAt } = ticket
    const [time, timeFormat] = useMemo(() => {
      const fromMill = timeFromMilliseconds(isoDateToMilliseconds(createdAt))

      return [fromMill, fromMill.toFormat('ff')]
    }, [createdAt])

    return (
      <div {...rootProps} data-cy={`ticket-${id}`}>
        <div className={classes.main}>
          <div className={classes.title}>
            <StatusCircle color={stateColor} tooltip={stateName} />
            <Typography noWrap component="span">
              {subject}
            </Typography>
          </div>
          <div className={classes.caption}>
            <span data-cy="id">{`#${id}`}</span>
            <span title={timeFormat}>
              {`${T.Created} `}
              <Timer initial={time} />
            </span>
          </div>
        </div>
      </div>
    )
  }
)

SupportCard.propTypes = {
  ticket: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
}

SupportCard.displayName = 'SupportCard'

export default SupportCard
