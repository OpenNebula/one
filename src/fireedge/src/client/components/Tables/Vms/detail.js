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
import * as React from 'react'
import PropTypes from 'prop-types'
import { LinearProgress } from '@material-ui/core'

import { useFetch, useSocket } from 'client/hooks'
import { useVmApi } from 'client/features/One'

import VmTabs from 'client/components/Tabs/Vm'

const VmDetail = React.memo(({ id }) => {
  const { getHooksSocket } = useSocket()
  const { getVm } = useVmApi()

  const {
    data,
    fetchRequest,
    loading,
    error
  } = useFetch(getVm, getHooksSocket({ resource: 'vm', id }))

  React.useEffect(() => {
    fetchRequest(id)
  }, [id])

  if ((!data && !error) || loading) {
    return <LinearProgress color='secondary' style={{ width: '100%' }} />
  }

  if (error) {
    return <div>{error || 'Error'}</div>
  }

  return <VmTabs data={data} />
})

VmDetail.propTypes = {
  id: PropTypes.string.isRequired
}

VmDetail.displayName = 'VmDetail'

export default VmDetail
