import * as React from 'react'

import {
  User as UserIcon,
  Group as GroupIcon,
  Archive as ImageIcon,
  NetworkAlt as NetworkIcon
} from 'iconoir-react'
import { makeStyles } from '@material-ui/core'

import { useUser, useGroup, useImage, useVNetwork } from 'client/features/One'
import Count from 'client/components/Count'
import { WavesCard } from 'client/components/Cards'
import { T } from 'client/constants'

const useStyles = makeStyles({
  root: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gridGap: '2em'
  }
})

const TotalProvisionInfrastructures = () => {
  const classes = useStyles()
  const users = useUser()
  const groups = useGroup()
  const images = useImage()
  const vnetworks = useVNetwork()

  return React.useMemo(() => (
    <div
      data-cy='dashboard-widget-total-sunstone-resources'
      className={classes.root}
    >
      <WavesCard
        text={T.Users}
        value={<Count number={`${users.length}`} />}
        bgColor='#fa7892'
        icon={UserIcon}
      />
      <WavesCard
        text={T.Groups}
        value={<Count number={`${groups.length}`} />}
        bgColor='#b25aff'
        icon={GroupIcon}
      />
      <WavesCard
        text={T.Images}
        value={<Count number={`${images.length}`} />}
        bgColor='#1fbbc6'
        icon={ImageIcon}
      />
      <WavesCard
        text={T.VirtualNetwork}
        value={<Count number={`${vnetworks.length}`} />}
        bgColor='#f09d42'
        icon={NetworkIcon}
      />
    </div>
  ), [users.length, groups.length, images.length, vnetworks.length])
}

TotalProvisionInfrastructures.displayName = 'TotalProvisionInfrastructures'

export default TotalProvisionInfrastructures
