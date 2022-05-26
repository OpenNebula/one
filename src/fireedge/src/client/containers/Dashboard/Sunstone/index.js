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
import { memo, useMemo, ReactElement } from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router-dom'
import { Box, CircularProgress, Grid } from '@mui/material'
import {
  ModernTv as VmsIcons,
  List as TemplatesIcon,
  Archive as ImageIcon,
  NetworkAlt as NetworkIcon,
} from 'iconoir-react'

import { useAuth, useViews } from 'client/features/Auth'
import { useGetVmsQuery } from 'client/features/OneApi/vm'
import { useGetTemplatesQuery } from 'client/features/OneApi/vmTemplate'
import { useGetImagesQuery } from 'client/features/OneApi/image'
import { useGetVNetworksQuery } from 'client/features/OneApi/network'

import NumberEasing from 'client/components/NumberEasing'
import WavesCard from 'client/components/Cards/WavesCard'
import { stringToBoolean } from 'client/models/Helper'
import { PATH } from 'client/apps/sunstone/routesOne'
import { T, RESOURCE_NAMES } from 'client/constants'

const { VM, VM_TEMPLATE, IMAGE, VNET } = RESOURCE_NAMES

/** @returns {ReactElement} Sunstone dashboard container */
function SunstoneDashboard() {
  const { settings: { DISABLE_ANIMATIONS } = {} } = useAuth()
  const { view, hasAccessToResource } = useViews()
  const { push: goTo } = useHistory()

  const vmAccess = useMemo(() => hasAccessToResource(VM), [view])
  const templateAccess = useMemo(() => hasAccessToResource(VM_TEMPLATE), [view])
  const imageAccess = useMemo(() => hasAccessToResource(IMAGE), [view])
  const vnetAccess = useMemo(() => hasAccessToResource(VNET), [view])

  return (
    <Box
      py={3}
      {...(stringToBoolean(DISABLE_ANIMATIONS) && {
        sx: {
          '& *, & *::before, & *::after': {
            animation: 'none !important',
          },
        },
      })}
    >
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
          onClick={vmAccess && (() => goTo(PATH.INSTANCE.VMS.LIST))}
        />
        <ResourceWidget
          query={useGetTemplatesQuery}
          bgColor="#b25aff"
          text={T.VMTemplates}
          icon={TemplatesIcon}
          onClick={templateAccess && (() => goTo(PATH.TEMPLATE.VMS.LIST))}
        />
        <ResourceWidget
          query={useGetImagesQuery}
          bgColor="#1fbbc6"
          text={T.Images}
          icon={ImageIcon}
          onClick={imageAccess && (() => goTo(PATH.STORAGE.IMAGES.LIST))}
        />
        <ResourceWidget
          query={useGetVNetworksQuery}
          bgColor="#f09d42"
          text={T.VirtualNetworks}
          icon={NetworkIcon}
          onClick={vnetAccess && (() => goTo(PATH.NETWORK.VNETS.LIST))}
        />
      </Grid>
    </Box>
  )
}

const ResourceWidget = memo(({ query, ...props }) => {
  const { data = [], isFetching } = query()

  return (
    <Grid item xs={12} sm={6} md={3}>
      <WavesCard
        value={
          isFetching ? (
            <CircularProgress size={20} />
          ) : (
            <NumberEasing value={data?.length} />
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
