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
import { Box, Grid } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useEffect, useMemo } from 'react'

import { useAuth, useGeneralApi, useViews } from '@FeaturesModule'
import { TranslateProvider } from '@ComponentsModule'
import { RESOURCE_NAMES } from '@ConstantsModule'
import { stringToBoolean } from '@ModelsModule'

import {
  ResourceSummaryCards,
  InfrastructureUtilization,
  StorageCapacity,
  HostMonitoringGraphs,
  VmStateDistribution,
  QuickActions,
} from './widgets'

const { HOST, DATASTORE } = RESOURCE_NAMES

/**
 * Sunstone admin dashboard with resource overview, utilization metrics,
 * monitoring graphs, state distribution, and quick actions.
 *
 * @param {object} props - Props
 * @param {string} props.view - Current view name
 * @returns {ReactElement} Sunstone dashboard container
 */
export default function SunstoneDashboard({ view }) {
  const { settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
  const { DISABLE_ANIMATIONS } = fireedge
  const { hasAccessToResource } = useViews()

  const { setSecondTitle } = useGeneralApi()
  useEffect(() => setSecondTitle({}), [])

  const hostAccess = useMemo(() => hasAccessToResource(HOST), [view])
  const datastoreAccess = useMemo(
    () => hasAccessToResource(DATASTORE),
    [view]
  )

  const styles = useMemo(() => {
    if (stringToBoolean(DISABLE_ANIMATIONS))
      return {
        '& *, & *::before, & *::after': { animation: 'none !important' },
      }
  }, [DISABLE_ANIMATIONS])

  return (
    <TranslateProvider>
      <Box py={3} sx={styles}>
        {/* Row 1: Enhanced Resource Summary Cards */}
        <ResourceSummaryCards
          disableAnimations={DISABLE_ANIMATIONS}
          view={view}
        />

        {/* Row 2: Infrastructure Utilization + Storage Capacity */}
        {(hostAccess || datastoreAccess) && (
          <Grid container spacing={3} sx={{ mt: 0 }}>
            {hostAccess && (
              <Grid item xs={12} md={6}>
                <InfrastructureUtilization view={view} />
              </Grid>
            )}
            {datastoreAccess && (
              <Grid item xs={12} md={6}>
                <StorageCapacity view={view} />
              </Grid>
            )}
          </Grid>
        )}

        {/* Row 3: Host CPU + Memory Monitoring Graphs */}
        {hostAccess && (
          <Box sx={{ mt: 3 }}>
            <HostMonitoringGraphs />
          </Box>
        )}

        {/* Row 4: VM State Distribution + Quick Actions */}
        <Grid container spacing={3} sx={{ mt: 0 }}>
          <Grid item xs={12} md={8}>
            <VmStateDistribution
              disableAnimations={stringToBoolean(DISABLE_ANIMATIONS)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <QuickActions view={view} />
          </Grid>
        </Grid>
      </Box>
    </TranslateProvider>
  )
}

SunstoneDashboard.displayName = 'SunstoneDashboard'

SunstoneDashboard.propTypes = {
  view: PropTypes.string,
}
