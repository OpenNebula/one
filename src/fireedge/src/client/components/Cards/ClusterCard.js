import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Badge, Box, CardContent } from '@material-ui/core'
import {
  Storage as ClusterIcon,
  Computer as HostIcon,
  AccountTree as NetworkIcon,
  FolderOpen as DatastoreIcon
} from '@material-ui/icons'

import SelectCard from 'client/components/Cards/SelectCard'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles(theme => ({
  badgesWrapper: {
    display: 'flex',
    gap: theme.typography.pxToRem(12)
  }
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
              title={Tr(T.VirtualsNetworks)}
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
      PropTypes.object
    ]),
    VNETS: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.object),
      PropTypes.object
    ]),
    DATASTORES: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.object),
      PropTypes.object
    ])
  }),
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func
}

ClusterCard.defaultProps = {
  value: {},
  isSelected: false,
  handleClick: undefined
}

ClusterCard.displayName = 'ClusterCard'

export default ClusterCard
