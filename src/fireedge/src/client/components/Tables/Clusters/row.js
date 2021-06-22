import * as React from 'react'
import PropTypes from 'prop-types'

import { HardDrive, NetworkAlt, Folder, Cloud } from 'iconoir-react'
import { Typography } from '@material-ui/core'

import { rowStyles } from 'client/components/Tables/styles'

const Row = ({ value, ...props }) => {
  const classes = rowStyles()
  const { ID, NAME, HOSTS, DATASTORES, VNETS, TEMPLATE } = value

  const hosts = [HOSTS?.ID ?? []].flat().length || 0
  const datastores = [DATASTORES?.ID ?? []].flat().length || 0
  const virtualNetworks = [VNETS?.ID ?? []].flat().length || 0

  return (
    <div {...props}>
      <div className={classes.main}>
        <Typography className={classes.title} component='span'>
          {NAME}
        </Typography>
        <div className={classes.caption}>
          <span>{`#${ID}`}</span>
          <span>
            <HardDrive size={16} />
            <span>{` ${hosts}`}</span>
          </span>
          <span>
            <Folder size={16} />
            <span>{` ${datastores}`}</span>
          </span>
          <span>
            <NetworkAlt size={16} />
            <span>{` ${virtualNetworks}`}</span>
          </span>
          {TEMPLATE?.PROVISION && <span>
            <Cloud size={16} />
            <span>{` ${TEMPLATE?.PROVISION?.PROVIDER_NAME}`}</span>
          </span>}
        </div>
      </div>
    </div>
  )
}

Row.propTypes = {
  value: PropTypes.object,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func
}

export default Row
