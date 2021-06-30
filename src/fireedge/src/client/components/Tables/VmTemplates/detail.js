import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { LinearProgress } from '@material-ui/core'

import Tabs from 'client/components/Tabs'

import { useFetch } from 'client/hooks'
import { useVmTemplateApi } from 'client/features/One'

import * as Helper from 'client/models/Helper'

const VmTemplateDetail = ({ id }) => {
  const { getVmTemplate } = useVmTemplateApi()
  const { data, fetchRequest, loading, error } = useFetch(getVmTemplate)

  useEffect(() => {
    fetchRequest(id)
  }, [id])

  if ((!data && !error) || loading) {
    return <LinearProgress color='secondary' style={{ width: '100%' }} />
  }

  if (error) {
    return <div>{error}</div>
  }

  const { ID, NAME, UNAME, GNAME, REGTIME, LOCK, TEMPLATE } = data

  const tabs = [
    {
      name: 'info',
      renderContent: (
        <div>
          <span>
            {`#${ID} - ${NAME}`}
          </span>
          <div>
            <p>Owner: {UNAME}</p>
            <p>Group: {GNAME}</p>
            <p>Locked: {Helper.levelLockToString(LOCK?.LOCKED)}</p>
            <p>Register time: {Helper.timeToString(REGTIME)}</p>
          </div>
        </div>
      )
    },
    {
      name: 'template',
      renderContent: (
        <div>
          <pre>
            <code>
              {JSON.stringify(TEMPLATE, null, 2)}
            </code>
          </pre>
        </div>
      )
    }
  ]

  return (
    <Tabs tabs={tabs} />
  )
}

VmTemplateDetail.propTypes = {
  id: PropTypes.string.isRequired
}

export default VmTemplateDetail
