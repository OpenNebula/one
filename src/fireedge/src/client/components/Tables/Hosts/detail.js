/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { LinearProgress } from '@material-ui/core'

import Tabs from 'client/components/Tabs'
import { StatusBadge } from 'client/components/Status'

import { useFetch, useSocket } from 'client/hooks'
import { useHostApi } from 'client/features/One'

import * as HostModel from 'client/models/Host'

const HostDetail = ({ id }) => {
  const { getHost } = useHostApi()

  const { getHooksSocket } = useSocket()
  const socket = getHooksSocket({ resource: 'host', id })

  const { data, fetchRequest, loading, error } = useFetch(getHost, socket)
  const isLoading = (!data && !error) || loading

  useEffect(() => {
    fetchRequest(id)
  }, [id])

  if (isLoading) {
    return <LinearProgress color='secondary' style={{ width: '100%' }} />
  }

  if (error) {
    return <div>{error}</div>
  }

  const { ID, NAME, IM_MAD, VM_MAD /* VMS, CLUSTER */ } = data

  const { name: stateName, color: stateColor } = HostModel.getState(data)

  const tabs = [
    {
      name: 'info',
      renderContent: (
        <div>
          <div>
            <StatusBadge
              title={stateName}
              stateColor={stateColor}
              customTransform='translate(150%, 50%)'
            />
            <span style={{ marginLeft: 20 }}>
              {`#${ID} - ${NAME}`}
            </span>
          </div>
          <div>
            <p>IM_MAD: {IM_MAD}</p>
            <p>VM_MAD: {VM_MAD}</p>
          </div>
        </div>
      )
    }
  ]

  return (
    <Tabs tabs={tabs} />
  )
}

HostDetail.propTypes = {
  id: PropTypes.string.isRequired
}

export default HostDetail
