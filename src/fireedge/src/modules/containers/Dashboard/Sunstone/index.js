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
import { Box, CircularProgress, Grid } from '@mui/material'
import {
  BoxIso as ImageIcon,
  NetworkAlt as NetworkIcon,
  EmptyPage as TemplatesIcon,
  ModernTv as VmsIcons,
} from 'iconoir-react'
import PropTypes from 'prop-types'
import { ReactElement, memo, useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import {
  VmTemplateAPI,
  VmAPI,
  VnAPI,
  ImageAPI,
  useAuth,
  useViews,
} from '@FeaturesModule'

import {
  WavesCard,
  NumberEasing,
  PATH,
  TranslateProvider,
} from '@ComponentsModule'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { stringToBoolean } from '@ModelsModule'

const { VM, VM_TEMPLATE, IMAGE, VNET } = RESOURCE_NAMES

/** @returns {ReactElement} Sunstone dashboard container */
export function SunstoneDashboard() {
  const { settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
  const { DISABLE_ANIMATIONS } = fireedge
  const { view, hasAccessToResource } = useViews()
  const { push: goTo } = useHistory()

  const vmAccess = useMemo(() => hasAccessToResource(VM), [view])
  const templateAccess = useMemo(() => hasAccessToResource(VM_TEMPLATE), [view])
  const imageAccess = useMemo(() => hasAccessToResource(IMAGE), [view])
  const vnetAccess = useMemo(() => hasAccessToResource(VNET), [view])

  const styles = useMemo(() => {
    if (stringToBoolean(DISABLE_ANIMATIONS))
      return {
        '& *, & *::before, & *::after': { animation: 'none !important' },
      }
  }, [DISABLE_ANIMATIONS])

  return (
    <TranslateProvider>
      <Box py={3} sx={styles}>
        <Grid
          container
          data-cy="dashboard-widget-total-sunstone-resources"
          spacing={3}
        >
          <ResourceWidget
            query={() => VmAPI.useGetVmsQuery({ extended: false })}
            bgColor="#fa7892"
            text={T.VMs}
            icon={VmsIcons}
            onClick={vmAccess && (() => goTo(PATH.INSTANCE.VMS.LIST))}
          />
          <ResourceWidget
            query={VmTemplateAPI.useGetTemplatesQuery}
            bgColor="#b25aff"
            text={T.VMTemplates}
            icon={TemplatesIcon}
            onClick={templateAccess && (() => goTo(PATH.TEMPLATE.VMS.LIST))}
          />
          <ResourceWidget
            query={ImageAPI.useGetImagesQuery}
            bgColor="#1fbbc6"
            text={T.Images}
            icon={ImageIcon}
            onClick={imageAccess && (() => goTo(PATH.STORAGE.IMAGES.LIST))}
          />
          <ResourceWidget
            query={VnAPI.useGetVNetworksQuery}
            bgColor="#f09d42"
            text={T.VirtualNetworks}
            icon={NetworkIcon}
            onClick={vnetAccess && (() => goTo(PATH.NETWORK.VNETS.LIST))}
          />
        </Grid>
      </Box>
    </TranslateProvider>
  )
}

const ResourceWidget = memo((props) => {
  const { settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
  const { DISABLE_ANIMATIONS } = fireedge
  const { query, onClick, text, bgColor, icon } = props
  const { data = [], isFetching } = query()

  const NumberElement = useMemo(() => {
    if (stringToBoolean(DISABLE_ANIMATIONS)) return data?.length

    return <NumberEasing value={data?.length} />
  }, [DISABLE_ANIMATIONS, data?.length])

  return (
    <Grid item xs={12} sm={6} md={3}>
      <WavesCard
        bgColor={bgColor}
        icon={icon}
        text={text}
        value={isFetching ? <CircularProgress size={20} /> : NumberElement}
        onClick={onClick || undefined}
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
  onClick: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
}
