import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Badge, Box, CardContent } from '@material-ui/core'
import StorageIcon from '@material-ui/icons/Storage'
import VideogameAssetIcon from '@material-ui/icons/VideogameAsset'
import AccountTreeIcon from '@material-ui/icons/AccountTree'
import FolderOpenIcon from '@material-ui/icons/FolderOpen'

import { Tr } from 'client/components/HOC'
import SelectCard from './SelectCard'

const useStyles = makeStyles(theme => ({
  badgesWrapper: {
    display: 'flex',
    gap: theme.typography.pxToRem(12)
  }
}))

const ClusterCard = memo(
  ({ value, isSelected, handleClick }) => {
    const classes = useStyles()
    const { NAME, HOSTS, VNETS, DATASTORES } = value

    const hosts = [HOSTS?.ID ?? []].flat()
    const vnets = [VNETS?.ID ?? []].flat()
    const datastores = [DATASTORES?.ID ?? []].flat()

    const badgePosition = { vertical: 'top', horizontal: 'right' }

    return (
      <SelectCard
        title={NAME}
        icon={<StorageIcon />}
        isSelected={isSelected}
        handleClick={handleClick}
      >
        <CardContent>
          <Box className={classes.badgesWrapper}>
            <Badge
              showZero
              title={Tr('Hosts')}
              classes={{ badge: 'badge' }}
              color="primary"
              badgeContent={hosts.length}
              anchorOrigin={badgePosition}
            >
              <VideogameAssetIcon />
            </Badge>
            <Badge
              showZero
              title={Tr('Virtual networks')}
              classes={{ badge: 'badge' }}
              color="primary"
              badgeContent={vnets.length}
              anchorOrigin={badgePosition}
            >
              <AccountTreeIcon />
            </Badge>
            <Badge
              showZero
              title={Tr('Datastores')}
              classes={{ badge: 'badge' }}
              color="primary"
              badgeContent={datastores.length}
              anchorOrigin={badgePosition}
            >
              <FolderOpenIcon />
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
      PropTypes.string,
      PropTypes.object
    ]),
    VNETS: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]),
    DATASTORES: PropTypes.oneOfType([
      PropTypes.string,
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
