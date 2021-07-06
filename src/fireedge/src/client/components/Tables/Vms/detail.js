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
