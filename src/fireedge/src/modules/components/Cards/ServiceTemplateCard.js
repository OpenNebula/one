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
import { Typography, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, memo, useMemo } from 'react'

import { Network, Package } from 'iconoir-react'

import { useAuth, useViews } from '@FeaturesModule'
import { Tr } from '@modules/components/HOC'
import MultipleTags from '@modules/components/MultipleTagsCard'
import { rowStyles } from '@modules/components/Tables/styles'
import Timer from '@modules/components/Timer'

import { ACTIONS, RESOURCE_NAMES, ServiceTemplate, T } from '@ConstantsModule'
import {
  getColorFromString,
  getUniqueLabels,
  timeFromMilliseconds,
} from '@ModelsModule'

const ServiceTemplateCard = memo(
  /**
   * @param {object} props - Props
   * @param {ServiceTemplate} props.template - Service Template resource
   * @param {object} props.rootProps - Props to root component
   * @param {function(string):Promise} [props.onDeleteLabel] - Callback to delete label
   * @param {ReactElement} [props.actions] - Actions
   * @returns {ReactElement} - Card
   */
  ({ template, rootProps, actions, onDeleteLabel }) => {
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])
    const { labels: userLabels } = useAuth()
    const { [RESOURCE_NAMES.SERVICE_TEMPLATE]: serviceView } = useViews()

    const enableEditLabels =
      serviceView?.actions?.[ACTIONS.EDIT_LABELS] === true && !!onDeleteLabel

    const {
      ID,
      NAME,
      TEMPLATE: {
        BODY: {
          description,
          labels = {},
          networks = {},
          roles = {},
          registration_time: regTime,
        } = {},
      },
    } = template

    const numberOfRoles = useMemo(() => roles?.length ?? 0, [roles])

    const numberOfNetworks = useMemo(
      () => Object.keys(networks)?.length ?? 0,
      [networks]
    )

    const time = useMemo(() => timeFromMilliseconds(+regTime), [regTime])

    const uniqueLabels = useMemo(
      () =>
        getUniqueLabels(labels).reduce((acc, label) => {
          if (userLabels?.includes(label)) {
            acc.push({
              text: label,
              dataCy: `label-${label}`,
              stateColor: getColorFromString(label),
              onDelete: enableEditLabels && onDeleteLabel,
            })
          }

          return acc
        }, []),

      [labels, enableEditLabels, onDeleteLabel]
    )

    return (
      <div {...rootProps} data-cy={`service-template-${ID}`}>
        <div className={classes.main}>
          <div className={classes.title}>
            <Typography noWrap component="span" title={description}>
              {NAME}
            </Typography>
            <span className={classes.labels}>
              <MultipleTags tags={uniqueLabels} />
            </span>
          </div>
          <div className={classes.caption}>
            <span data-cy="id">{`#${ID}`}</span>
            <span title={time.toFormat('ff')}>
              <Timer translateWord={T.RegisteredAt} initial={time} />
            </span>
            <span title={`${Tr(T.Networks)}: ${numberOfNetworks}`}>
              <Network width={20} height={20} />
              <span data-cy="total-networks">{numberOfNetworks}</span>
            </span>
            <span title={`${Tr(T.Roles)}: ${numberOfRoles}`}>
              <Package width={20} height={20} />
              <span data-cy="total-roles">{numberOfRoles}</span>
            </span>
          </div>
        </div>
        {actions && <div className={classes.actions}>{actions}</div>}
      </div>
    )
  }
)

ServiceTemplateCard.propTypes = {
  template: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  onDeleteLabel: PropTypes.func,
  actions: PropTypes.any,
}

ServiceTemplateCard.displayName = 'ServiceTemplateCard'

export default ServiceTemplateCard
