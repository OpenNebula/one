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
import { PATH } from '@ComponentsModule'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { css } from '@emotion/css'
import {
  HostAPI,
  useGeneralApi,
  UserAPI,
  useViews,
  VmAPI,
} from '@FeaturesModule'
import {
  DashboardButton,
  DashboardButtonInstantiate,
} from '@modules/containers/Dashboard/Sunstone/Cloud/Buttons'
import {
  DashboardCardHostInfo,
  DashboardCardVMInfo,
} from '@modules/containers/Dashboard/Sunstone/Cloud/Cards'
import { Box, Grid, useTheme } from '@mui/material'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import { ReactElement, useEffect, useMemo } from 'react'
import { useHistory } from 'react-router-dom'

const { DASHBOARD, VM_TEMPLATE } = RESOURCE_NAMES

const styles = ({ typography }) => ({
  root: css({
    '& > *': {
      margin: '0',
    },
    '& > *:first-child': {
      margin: `0 0 ${typography.pxToRem(16)}`,
      alignItems: 'center',
    },
  }),
  buttons: css({
    textAlign: 'right',
    '& > *': {
      marginRight: `${typography.pxToRem(16)} `,
    },
    '& > *:last-child': {
      marginRight: '0',
    },
  }),
  sections: css({
    padding: '0',
  }),
  cards: css({
    gap: typography.pxToRem(16),
  }),
})

/**
 * @param {object} props - Props
 * @param {object} props.view - View
 * @returns {ReactElement} Cloud Dashboard container
 */
export default function CloudDashboard({ view }) {
  const { hasAccessToResource, getResourceView } = useViews()
  const theme = useTheme()
  const classes = useMemo(() => styles(theme))
  const { push: goTo } = useHistory()

  // Delete second title
  const { setSecondTitle } = useGeneralApi()
  useEffect(() => setSecondTitle({}), [])

  const { data: quotaData = {} } = UserAPI.useGetUserQuery({})
  const { data: vmpoolMonitoringData = {}, isFetching: isFetchingVm } =
    VmAPI.useGetMonitoringPoolQuery({ seconds: 3600 })
  const {
    data: hostpoolMonitoringData = {},
    isSuccess: isSuccessHost,
    isFetching: isFetchingHost,
  } = HostAPI.useGetHostMonitoringPoolQuery({ seconds: 3600 })
  const { actions = {}, graphs = {} } = useMemo(
    () => getResourceView(DASHBOARD) || {},
    [view]
  )
  const templateAccess = useMemo(() => hasAccessToResource(VM_TEMPLATE), [view])

  return (
    <Box py={3} className={classes.root}>
      <Grid container data-cy="dashboard-headers" className={classes.sections}>
        <Grid
          item
          xs={12}
          className={classes.buttons}
          style={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <DashboardButton
            access={actions?.settings}
            text={T.Settings}
            action={() => goTo(PATH.SETTINGS)}
          />
          <DashboardButtonInstantiate
            access={actions?.instantiate && templateAccess}
            text={T.CreateVM}
            action={(template) => goTo(PATH.TEMPLATE.VMS.INSTANTIATE, template)}
          />
        </Grid>
      </Grid>

      <Box
        display="grid"
        data-cy="dashboard-widget-total-cloud-graphs"
        className={clsx(classes.sections, classes.cards)}
        gridTemplateColumns={{
          sm: '1fr',
          md:
            hostpoolMonitoringData?.MONITORING_DATA?.MONITORING?.length &&
            isSuccessHost
              ? 'repeat(3, minmax(32%, 1fr))'
              : 'repeat(2, minmax(49%, 1fr))',
        }}
        gridAutoRows="auto"
        gap="1em"
      >
        <DashboardCardVMInfo
          quotaData={quotaData}
          vmpoolMonitoringData={vmpoolMonitoringData}
          access={graphs.cpu}
          type="cpu"
          showQuota
          isFetching={isFetchingVm}
        />
        <DashboardCardVMInfo
          quotaData={quotaData}
          vmpoolMonitoringData={vmpoolMonitoringData}
          access={graphs.memory}
          type="memory"
          unitBytes
          showQuota
          isFetching={isFetchingVm}
        />
        <DashboardCardVMInfo
          quotaData={quotaData}
          vmpoolMonitoringData={vmpoolMonitoringData}
          access={graphs.disks}
          type="disks"
          isFetching={isFetchingVm}
        />
        <DashboardCardVMInfo
          quotaData={quotaData}
          vmpoolMonitoringData={vmpoolMonitoringData}
          access={graphs.networks}
          type="networks"
          isFetching={isFetchingVm}
        />
        <DashboardCardHostInfo
          hostpoolMonitoringData={hostpoolMonitoringData}
          access={graphs['host-cpu']}
          type="host-cpu"
          isFetching={isFetchingHost}
        />
        <DashboardCardHostInfo
          hostpoolMonitoringData={hostpoolMonitoringData}
          access={graphs['host-memory']}
          type="host-memory"
          isFetching={isFetchingHost}
        />
      </Box>
    </Box>
  )
}

CloudDashboard.displayName = 'CloudDashboard'

CloudDashboard.propTypes = {
  view: PropTypes.string,
}
