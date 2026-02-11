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
import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'
import EventsViewer from '@modules/components/EventsViewer'
import { ClusterAPI, ProvisionAPI } from '@FeaturesModule'
import { OpenNebulaLogo } from '@modules/components/Icons'

/**
 * Render events viewer tab showing the Events of the cluster (only for OneForm clusters).
 *
 * @param {object} props - Props
 * @param {string} props.id - Cluster id
 * @returns {ReactElement} Events tab
 */
const Events = ({ id }) => {
  // Get info about the cluster
  const { data: cluster } = ClusterAPI.useGetClusterQuery({ id })
  const provisionID = cluster?.TEMPLATE?.ONEFORM?.PROVISION_ID
  const { data: dataProvision = {} } = provisionID
    ? ProvisionAPI.useGetProvisionQuery({ id: provisionID, extended: true })
    : { data: {}, refetch: () => undefined }

  return dataProvision ? (
    <EventsViewer events={dataProvision?.TEMPLATE?.PROVISION_BODY?.historic} />
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
