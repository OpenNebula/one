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
import { Component } from 'react'

import { EventsViewer } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { ProvisionAPI } from '@FeaturesModule'

/**
 * Render events viewer tab showing the Events of the cluster.
 *
 * @param {object} root0 - Params
 * @param {object} root0.data - Cluster tab data
 * @returns {Component} Events tab
 */
export const Events = ({ data = {} }) => {
  const { selected: cluster = {} } = data
  const provisionId = cluster?.TEMPLATE?.ONEFORM?.PROVISION_ID

  const { data: dataProvision = {}, isFetching } =
    ProvisionAPI.useGetProvisionQuery(
      { id: provisionId, extended: true },
      { skip: !provisionId }
    )

  const events = dataProvision?.TEMPLATE?.PROVISION_BODY?.historic

  return <EventsViewer events={events} isLoading={isFetching} />
}

Events.propTypes = {
  data: PropTypes.object,
}

Events.id = 'events'
Events.title = T.Events
