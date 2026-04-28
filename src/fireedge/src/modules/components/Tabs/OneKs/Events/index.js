/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'
import EventsViewer from '@modules/components/EventsViewer'
import { OneKsAPI } from '@FeaturesModule'
import { OpenNebulaLogo } from '@modules/components/Icons'

/**
 * Render events viewer tab showing the Events of the cluster (only for OneForm clusters).
 *
 * @param {object} props - Props
 * @param {string} props.id - Cluster id
 * @returns {ReactElement} Events tab
 */
const Events = ({ id }) => {
  const { data: cluster = {} } = OneKsAPI.useGetOneKsClusterQuery({ id })
  const { DOCUMENT } = cluster
  const events = DOCUMENT?.TEMPLATE?.CLUSTER_BODY?.historic || []

  return events.length > 0 ? (
    <EventsViewer events={events} />
  ) : (
    <Stack
      direction="row"
      sx={{ justifyContent: 'center', alignItems: 'center' }}
    >
      <OpenNebulaLogo width={150} height={150} spinner />
    </Stack>
  )
}

Events.propTypes = {
  id: PropTypes.string,
}

Events.displayName = 'Events'
Events.label = 'Events'

export default Events
