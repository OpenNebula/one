/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { useTheme, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import Timer from '@modules/components/Timer'
import { StatusCircle } from '@modules/components/Status'
import { rowStyles } from '@modules/components/Tables/styles'

import { timeFromMilliseconds, getServiceState } from '@ModelsModule'
import { T, Service } from '@ConstantsModule'

const ServiceCard = memo(
  /**
   * @param {object} props - Props
   * @param {Service} props.service - Service resource
   * @param {object} props.rootProps - Props to root component
   * @param {ReactElement} [props.actions] - Actions
   * @returns {ReactElement} - Card
   */
  ({ service, rootProps, actions }) => {
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])

    const {
      ID,
      NAME,
      TEMPLATE: { BODY: { description, start_time: startTime } = {} },
    } = service

    const { color: stateColor, name: stateName } = getServiceState(service)
    const time = useMemo(() => timeFromMilliseconds(+startTime), [startTime])

    return (
      <div {...rootProps} data-cy={`service-template-${ID}`}>
        <div className={classes.main}>
          <div className={classes.title}>
            <StatusCircle color={stateColor} tooltip={stateName} />
            <Typography noWrap component="span" title={description}>
              {NAME}
            </Typography>
          </div>
          <div className={classes.caption}>
            <span data-cy="id">{`#${ID}`}</span>
            <span title={time.toFormat('ff')}>
              <Timer translateWord={T.RegisteredAt} initial={time} />
            </span>
          </div>
        </div>
        {actions && <div className={classes.actions}>{actions}</div>}
      </div>
    )
  }
)

ServiceCard.propTypes = {
  service: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  onDeleteLabel: PropTypes.func,
  actions: PropTypes.any,
}

ServiceCard.displayName = 'ServiceCard'

export default ServiceCard
