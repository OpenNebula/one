/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, memo, useMemo, useEffect } from 'react'
import { useHistory } from 'react-router-dom'

import {
  ImageAPI,
  VmAPI,
  VmTemplateAPI,
  VnAPI,
  useAuth,
  useViews,
  useGeneralApi,
} from '@FeaturesModule'

import {
  NumberEasing,
  PATH,
  TranslateProvider,
  WavesCard,
} from '@ComponentsModule'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { stringToBoolean } from '@ModelsModule'

const { VM, VM_TEMPLATE, IMAGE, VNET } = RESOURCE_NAMES

/**
 * @param {object} props - Props
 * @param {object} props.view - View
 * @returns {ReactElement} Sunstone dashboard container
 */
export default function SunstoneDashboard({ view }) {
  const { settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
  const { DISABLE_ANIMATIONS } = fireedge
  const { hasAccessToResource } = useViews()

  // Empty subsection in breadcrumb
  const { setBreadcrumb } = useGeneralApi()
  useEffect(() => setBreadcrumb({}), [])

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
            type="vms"
            bgColor="#fa7892"
            text={T.VMs}
            icon={VmsIcons}
            onClick={vmAccess && (() => goTo(PATH.INSTANCE.VMS.LIST))}
            disableAnimations={DISABLE_ANIMATIONS}
          />
          <ResourceWidget
            type="vmtemples"
            bgColor="#b25aff"
            text={T.VMTemplates}
            icon={TemplatesIcon}
            onClick={templateAccess && (() => goTo(PATH.TEMPLATE.VMS.LIST))}
            disableAnimations={DISABLE_ANIMATIONS}
          />
          <ResourceWidget
            type="images"
            bgColor="#1fbbc6"
            text={T.Images}
            icon={ImageIcon}
            onClick={imageAccess && (() => goTo(PATH.STORAGE.IMAGES.LIST))}
            disableAnimations={DISABLE_ANIMATIONS}
          />
          <ResourceWidget
            type="vnets"
            bgColor="#f09d42"
            text={T.VirtualNetworks}
            icon={NetworkIcon}
            onClick={vnetAccess && (() => goTo(PATH.NETWORK.VNETS.LIST))}
            disableAnimations={DISABLE_ANIMATIONS}
          />
        </Grid>
      </Box>
    </TranslateProvider>
  )
}

SunstoneDashboard.displayName = 'SunstoneDashboard'

SunstoneDashboard.propTypes = {
  view: PropTypes.object,
}

const ResourceWidget = memo(
  ({ type = 'vms', onClick, text, bgColor, icon, disableAnimations }) => {
    const options = {
      vmtemples: VmTemplateAPI.useGetTemplatesQuery(undefined, {
        skip: type !== 'vmtemples',
      }),
      images: ImageAPI.useGetImagesQuery(undefined, {
        skip: type !== 'images',
      }),
      vnets: VnAPI.useGetVNetworksQuery(undefined, { skip: type !== 'vnets' }),
      vms: VmAPI.useGetVmsQuery({ extended: false }, { skip: type !== 'vms' }),
    }

    const { data = [], isFetching } = options[type] || {}

    const NumberElement = useMemo(() => {
      if (stringToBoolean(disableAnimations)) return data?.length

      return <NumberEasing value={data?.length} />
    }, [disableAnimations, data?.length])

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
  }
)

ResourceWidget.displayName = 'ResourceWidget'

ResourceWidget.propTypes = {
  type: PropTypes.string,
  onClick: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  text: PropTypes.string,
  bgColor: PropTypes.string,
  icon: PropTypes.any,
  disableAnimations: PropTypes.bool,
}
