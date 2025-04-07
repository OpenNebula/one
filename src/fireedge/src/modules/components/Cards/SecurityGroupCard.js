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
import PropTypes from 'prop-types'
import { memo, ReactElement, useMemo } from 'react'

import { Typography, useTheme } from '@mui/material'
import { Group, PcCheck, PcNoEntry, PcWarning, User } from 'iconoir-react'

import { SecurityGroup, T, RESOURCE_NAMES } from '@ConstantsModule'
import { css } from '@emotion/css'
import { useAuth } from '@FeaturesModule'
import { getColorFromString } from '@ModelsModule'
import { Tr } from '@modules/components/HOC'
import MultipleTags from '@modules/components/MultipleTagsCard'
import { rowStyles } from '@modules/components/Tables/styles'
import clsx from 'clsx'
import { getResourceLabels } from '@UtilsModule'

const getTotalOfResources = (resources) =>
  [resources?.ID ?? []].flat().length || 0

const useStyles = () => ({
  internalContainer: css({
    display: 'flex',
  }),
  actions: css({
    marginLeft: 'auto',
  }),
})

const SecurityGroupCard = memo(
  /**
   * @param {object} props - Props
   * @param {SecurityGroup} props.securityGroup - Security Group resource
   * @param {object} props.rootProps - Props to root component
   * @param {ReactElement} [props.actions] - Actions
   * @param {function(string):Promise} [props.onClickLabel] - Callback to click label
   * @returns {ReactElement} - Card
   */
  ({ securityGroup, rootProps, actions, onClickLabel }) => {
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])

    const internalClasses = useStyles()

    const { labels } = useAuth()
    const LABELS = getResourceLabels(
      labels,
      securityGroup?.ID,
      RESOURCE_NAMES.SEC_GROUP
    )

    const { ID, NAME, UNAME, GNAME, UPDATED_VMS, OUTDATED_VMS, ERROR_VMS } =
      securityGroup

    const [totalUpdatedVms, totalOutdatedVms, totalErrorVms] = useMemo(
      () => [
        getTotalOfResources(UPDATED_VMS),
        getTotalOfResources(OUTDATED_VMS),
        getTotalOfResources(ERROR_VMS),
      ],
      [UPDATED_VMS?.ID, OUTDATED_VMS?.ID, ERROR_VMS?.ID]
    )

    const userLabels = useMemo(
      () =>
        LABELS?.user?.map((label) => ({
          text: label?.replace(/\$/g, ''),
          dataCy: `label-${label}`,
          stateColor: getColorFromString(label),
          onClick: onClickLabel,
        })) || [],
      [LABELS, onClickLabel]
    )

    const groupLabels = useMemo(
      () =>
        Object.entries(LABELS?.group || {}).flatMap(([group, gLabels]) =>
          gLabels.map((gLabel) => ({
            text: gLabel?.replace(/\$/g, ''),
            dataCy: `group-label-${group}-${gLabel}`,
            stateColor: getColorFromString(gLabel),
            onClick: onClickLabel,
          }))
        ),
      [LABELS, onClickLabel]
    )

    return (
      <div
        {...rootProps}
        className={clsx(rootProps?.className, classes.root)}
        data-cy={`secgroup-${ID}`}
      >
        <div className={clsx(classes.main, internalClasses.internalContainer)}>
          <div>
            <div className={classes.title}>
              <Typography noWrap component="span">
                {NAME}
              </Typography>

              <MultipleTags limitTags={1} tags={userLabels} />
              <MultipleTags limitTags={1} tags={groupLabels} />
            </div>
            <div className={classes.caption}>
              <span>{`#${ID}`}</span>
              <span title={`${Tr(T.Owner)}: ${UNAME}`}>
                <User />
                <span data-cy="uname">{` ${UNAME}`}</span>
              </span>
              <span title={`${Tr(T.Group)}: ${GNAME}`}>
                <Group />
                <span data-cy="gname">{` ${GNAME}`}</span>
              </span>
              <span title={`${Tr(T.TotalUpdatedVms)}: ${totalUpdatedVms}`}>
                <PcCheck />
                <span>{` ${totalUpdatedVms}`}</span>
              </span>
              <span title={`${Tr(T.TotalOutdatedVms)}: ${totalOutdatedVms}`}>
                <PcNoEntry />
                <span>{` ${totalOutdatedVms}`}</span>
              </span>
              <span title={`${Tr(T.TotalErrorVms)}: ${totalErrorVms}`}>
                <PcWarning />
                <span>{` ${totalErrorVms}`}</span>
              </span>
            </div>
          </div>

          {actions && (
            <div className={clsx(classes.actions, internalClasses.actions)}>
              {actions}
            </div>
          )}
        </div>
      </div>
    )
  }
)

SecurityGroupCard.propTypes = {
  securityGroup: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  onClickLabel: PropTypes.func,
  onDeleteLabel: PropTypes.func,
  actions: PropTypes.any,
}

SecurityGroupCard.displayName = 'SecurityGroupCard'

export default SecurityGroupCard
