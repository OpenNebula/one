import React, { useEffect } from 'react'
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

  const { ID, NAME, IM_MAD, VM_MAD, VMS, CLUSTER } = data

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

export default HostDetail
