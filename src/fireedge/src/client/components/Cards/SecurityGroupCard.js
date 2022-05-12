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
import { memo, ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'

import { User, Group, PcCheck, PcNoEntry, PcWarning } from 'iconoir-react'
import { Typography } from '@mui/material'

import { rowStyles } from 'client/components/Tables/styles'
import { SecurityGroup } from 'client/constants'

const getTotalOfResources = (resources) =>
  [resources?.ID ?? []].flat().length || 0

const SecurityGroupCard = memo(
  /**
   * @param {object} props - Props
   * @param {SecurityGroup} props.securityGroup - Security Group resource
   * @param {object} props.rootProps - Props to root component
   * @param {ReactElement} [props.actions] - Actions
   * @returns {ReactElement} - Card
   */
  ({ securityGroup, rootProps, actions }) => {
    const classes = rowStyles()

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

    return (
      <div {...rootProps} data-cy={`secgroup-${ID}`}>
        <div className={classes.main}>
          <div className={classes.title}>
            <Typography noWrap component="span">
              {NAME}
            </Typography>
          </div>
          <div className={classes.caption}>
            <span>{`#${ID}`}</span>
            <span title={`Owner: ${UNAME}`}>
              <User />
              <span data-cy="uname">{` ${UNAME}`}</span>
            </span>
            <span title={`Group: ${GNAME}`}>
              <Group />
              <span data-cy="gname">{` ${GNAME}`}</span>
            </span>
            <span title={`Total updated VMs: ${totalUpdatedVms}`}>
              <PcCheck />
              <span>{` ${totalUpdatedVms}`}</span>
            </span>
            <span title={`Total outdated VMs: ${totalOutdatedVms}`}>
              <PcNoEntry />
              <span>{` ${totalOutdatedVms}`}</span>
            </span>
            <span title={`Total error VMs: ${totalErrorVms}`}>
              <PcWarning />
              <span>{` ${totalErrorVms}`}</span>
            </span>
          </div>
          {actions && <div className={classes.actions}>{actions}</div>}
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
  actions: PropTypes.any,
}

SecurityGroupCard.displayName = 'SecurityGroupCard'

export default SecurityGroupCard
