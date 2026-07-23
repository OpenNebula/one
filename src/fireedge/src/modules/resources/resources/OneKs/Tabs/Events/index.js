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
import { ReactElement } from 'react'
import { EventsViewer } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'

/**
 * Render events viewer tab showing the Events of the cluster (only for OneForm clusters).
 *
 * @param {object} props - Props
 * @param {object} props.data - Tab data
 * @returns {ReactElement} Events tab
 */
const Events = ({ data: tabData }) => {
  const cluster = tabData?.selected ?? {}
  const events = cluster?.TEMPLATE?.CLUSTER_BODY?.historic ?? []

  return <EventsViewer events={events} isLoading={tabData?.isLoading} />
}

Events.propTypes = {
  data: PropTypes.object,
}

Events.displayName = 'Events'
Events.id = 'events'
Events.title = T.Events

export default Events
