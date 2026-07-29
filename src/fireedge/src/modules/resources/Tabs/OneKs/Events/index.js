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
import PropTypes from 'prop-types'
import { ReactElement, useMemo } from 'react'
import { LogsViewer } from '@ComponentsV2Module'
import { OneKsAPI } from '@FeaturesModule'
import { oneKsEventsToLogs } from '@UtilsModule'

/**
 * Render events viewer tab showing the Events of the cluster (only for OneForm clusters).
 *
 * @param {object} props - Props
 * @param {string} props.id - Cluster id
 * @returns {ReactElement} Events tab
 */
const Events = ({ id }) => {
  const {
    data: cluster = {},
    refetch,
    isFetching,
  } = OneKsAPI.useGetOneKsClusterQuery({ id }, { skip: !id })
  const { DOCUMENT } = cluster
  const events = DOCUMENT?.TEMPLATE?.CLUSTER_BODY?.historic || []
  const logs = useMemo(() => oneKsEventsToLogs(events), [events])

  return <LogsViewer logs={logs} getLogs={refetch} isFetching={isFetching} />
}

Events.propTypes = {
  id: PropTypes.string,
}

Events.displayName = 'Events'
Events.label = 'Events'

export default Events
