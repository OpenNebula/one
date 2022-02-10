/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import { useMemo } from 'react'

import {
  User as UserIcon,
  Group as GroupIcon,
  Archive as ImageIcon,
  NetworkAlt as NetworkIcon,
} from 'iconoir-react'
import { Skeleton, Grid } from '@mui/material'

import { useUser, useGroup, useImage, useVNetwork } from 'client/features/One'
import NumberEasing from 'client/components/NumberEasing'
import { WavesCard } from 'client/components/Cards'
import { T } from 'client/constants'

const TOTAL_WIDGETS = 4
const breakpoints = { xs: 12, sm: 6, md: 3 }

const TotalProvisionInfrastructures = ({ isLoading }) => {
  const users = useUser()
  const groups = useGroup()
  const images = useImage()
  const vNetworks = useVNetwork()

  return useMemo(
    () => (
      <Grid
        data-cy="dashboard-widget-total-sunstone-resources"
        container
        spacing={3}
      >
        {!users?.length && isLoading ? (
          Array.from(Array(TOTAL_WIDGETS)).map((_, index) => (
            <Grid item {...breakpoints} key={index}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))
        ) : (
          <>
            <Grid item {...breakpoints}>
              <WavesCard
                text={T.Users}
                value={<NumberEasing value={`${users.length}`} />}
                bgColor="#fa7892"
                icon={UserIcon}
              />
            </Grid>
            <Grid item {...breakpoints}>
              <WavesCard
                text={T.Groups}
                value={<NumberEasing value={`${groups.length}`} />}
                bgColor="#b25aff"
                icon={GroupIcon}
              />
            </Grid>
            <Grid item {...breakpoints}>
              <WavesCard
                text={T.Images}
                value={<NumberEasing value={`${images.length}`} />}
                bgColor="#1fbbc6"
                icon={ImageIcon}
              />
            </Grid>
            <Grid item {...breakpoints}>
              <WavesCard
                text={T.VirtualNetwork}
                value={<NumberEasing value={`${vNetworks.length}`} />}
                bgColor="#f09d42"
                icon={NetworkIcon}
              />
            </Grid>
          </>
        )}
      </Grid>
    ),
    [users?.length, isLoading]
  )
}

TotalProvisionInfrastructures.displayName = 'TotalProvisionInfrastructures'

export default TotalProvisionInfrastructures
