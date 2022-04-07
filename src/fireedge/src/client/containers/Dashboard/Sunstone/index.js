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
import { memo, ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Container, Box, CircularProgress, Grid } from '@mui/material'
import {
  ModernTv as VmsIcons,
  List as TemplatesIcon,
  Archive as ImageIcon,
  NetworkAlt as NetworkIcon,
} from 'iconoir-react'

import { useAuth } from 'client/features/Auth'
import { useGetVmsQuery } from 'client/features/OneApi/vm'
import { useGetTemplatesQuery } from 'client/features/OneApi/vmTemplate'
import { useGetImagesQuery } from 'client/features/OneApi/image'
import { useGetVNetworksQuery } from 'client/features/OneApi/network'
import NumberEasing from 'client/components/NumberEasing'
import WavesCard from 'client/components/Cards/WavesCard'
import { stringToBoolean } from 'client/models/Helper'
import { T } from 'client/constants'

/** @returns {ReactElement} Sunstone dashboard container */
function SunstoneDashboard() {
  const { settings: { DISABLE_ANIMATIONS } = {} } = useAuth()

  return (
    <Container
      disableGutters
      {...(stringToBoolean(DISABLE_ANIMATIONS) && {
        sx: {
          '& *, & *::before, & *::after': {
            animation: 'none !important',
          },
        },
      })}
    >
      <Box py={3}>
        <Grid
          container
          data-cy="dashboard-widget-total-sunstone-resources"
          spacing={3}
        >
          <ResourceWidget
            query={useGetVmsQuery}
            bgColor="#fa7892"
            text={T.VMs}
            icon={VmsIcons}
          />
          <ResourceWidget
            query={useGetTemplatesQuery}
            bgColor="#b25aff"
            text={T.VMTemplates}
            icon={TemplatesIcon}
          />
          <ResourceWidget
            query={useGetImagesQuery}
            bgColor="#1fbbc6"
            text={T.Images}
            icon={ImageIcon}
          />
          <ResourceWidget
            query={useGetVNetworksQuery}
            bgColor="#f09d42"
            text={T.VirtualNetworks}
            icon={NetworkIcon}
          />
        </Grid>
      </Box>
    </Container>
  )
}

const ResourceWidget = memo(({ query, ...props }) => {
  const { data, isLoading } = query()
  const total = `${data?.length ?? 0}`

  return (
    <Grid item xs={12} sm={6} md={3}>
      <WavesCard
        value={
          isLoading ? (
            <CircularProgress size={20} />
          ) : (
            <NumberEasing value={total} />
          )
        }
        {...props}
      />
    </Grid>
  )
})

ResourceWidget.displayName = 'ResourceWidget'

ResourceWidget.propTypes = {
  query: PropTypes.func,
  text: PropTypes.string,
  bgColor: PropTypes.string,
  icon: PropTypes.any,
}

export default SunstoneDashboard
