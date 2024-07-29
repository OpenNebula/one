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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { Badge, Box, CardContent } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import {
  Server as ClusterIcon,
  HardDrive as HostIcon,
  NetworkAlt as NetworkIcon,
  Folder as DatastoreIcon,
} from 'iconoir-react'

import { SelectCard } from 'client/components/Cards'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles((theme) => ({
  badgesWrapper: {
    display: 'flex',
    gap: theme.typography.pxToRem(12),
  },
}))

const ClusterCard = memo(
  ({ value, isSelected, handleClick }) => {
    const classes = useStyles()
    const { ID, NAME, HOSTS, VNETS, DATASTORES } = value

    const hosts = [HOSTS?.ID ?? []].flat()
    const vnets = [VNETS?.ID ?? []].flat()
    const datastores = [DATASTORES?.ID ?? []].flat()

    const badgePosition = { vertical: 'top', horizontal: 'right' }

    return (
      <SelectCard
        title={`${ID} - ${NAME}`}
        icon={<ClusterIcon />}
        isSelected={isSelected}
        handleClick={handleClick}
      >
        <CardContent>
          <Box className={classes.badgesWrapper}>
            <Badge
              showZero
              title={Tr(T.Hosts)}
              classes={{ badge: 'badge' }}
              color="primary"
              badgeContent={hosts.length}
              anchorOrigin={badgePosition}
            >
              <HostIcon />
            </Badge>
            <Badge
              showZero
              title={Tr(T.VirtualNetworks)}
              classes={{ badge: 'badge' }}
              color="primary"
              badgeContent={vnets.length}
              anchorOrigin={badgePosition}
            >
              <NetworkIcon />
            </Badge>
            <Badge
              showZero
              title={Tr(T.Datastores)}
              classes={{ badge: 'badge' }}
              color="primary"
              badgeContent={datastores.length}
              anchorOrigin={badgePosition}
            >
              <DatastoreIcon />
            </Badge>
          </Box>
        </CardContent>
      </SelectCard>
    )
  },
  (prev, next) => prev.isSelected === next.isSelected
)

ClusterCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string,
    NAME: PropTypes.string.isRequired,
    HOSTS: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.object),
      PropTypes.object,
    ]),
    VNETS: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.object),
      PropTypes.object,
    ]),
    DATASTORES: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.object),
      PropTypes.object,
    ]),
  }),
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
}

ClusterCard.defaultProps = {
  value: {},
  isSelected: false,
  handleClick: undefined,
}

ClusterCard.displayName = 'ClusterCard'

export default ClusterCard
