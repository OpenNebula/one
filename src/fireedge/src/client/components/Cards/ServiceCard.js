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
import { ReactElement, memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import { WarningCircledOutline as WarningIcon } from 'iconoir-react'
import { Typography } from '@mui/material'

import { useViews } from 'client/features/Auth'
import MultipleTags from 'client/components/MultipleTags'
import Timer from 'client/components/Timer'
import { StatusCircle } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'

import {
  timeFromMilliseconds,
  getUniqueLabels,
  getColorFromString,
} from 'client/models/Helper'
import { getState } from 'client/models/Service'
import { T, Service, ACTIONS, RESOURCE_NAMES } from 'client/constants'

const ServiceCard = memo(
  /**
   * @param {object} props - Props
   * @param {Service} props.service - Service resource
   * @param {object} props.rootProps - Props to root component
   * @param {function(string):Promise} [props.onDeleteLabel] - Callback to delete label
   * @param {ReactElement} [props.actions] - Actions
   * @returns {ReactElement} - Card
   */
  ({ service, rootProps, actions, onDeleteLabel }) => {
    const classes = rowStyles()
    const { [RESOURCE_NAMES.SERVICE]: serviceView } = useViews()

    const enableEditLabels =
      serviceView?.actions?.[ACTIONS.EDIT_LABELS] === true && !!onDeleteLabel

    const {
      ID,
      NAME,
      TEMPLATE: { BODY: { description, labels, start_time: startTime } = {} },
    } = service

    const { color: stateColor, name: stateName } = getState(service)
    const time = useMemo(() => timeFromMilliseconds(+startTime), [startTime])

    const uniqueLabels = useMemo(
      () =>
        getUniqueLabels(labels).map((label) => ({
          text: label,
          stateColor: getColorFromString(label),
          onDelete: enableEditLabels && onDeleteLabel,
        })),
      [labels, enableEditLabels, onDeleteLabel]
    )

    return (
      <div {...rootProps} data-cy={`service-template-${ID}`}>
        <div className={classes.main}>
          <div className={classes.title}>
            <StatusCircle color={stateColor} tooltip={stateName} />
            <Typography noWrap component="span" title={description}>
              {NAME}
            </Typography>
            <span className={classes.labels}>
              <WarningIcon title={description} />
              <MultipleTags tags={uniqueLabels} />
            </span>
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
