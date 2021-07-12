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
