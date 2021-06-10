import React, { useEffect, useState } from 'react'

import { Container } from '@material-ui/core'

import { useAuth } from 'client/features/Auth'
import { useVm, useVmApi } from 'client/features/One'
import { useFetch } from 'client/hooks'

import { VmTable } from 'client/components/Tables'

const INITIAL_ELEMENT = -1
const NUMBER_OF_INTERVAL = -100

function VirtualMachines () {
  const [{ start, end }, setPage] = useState(({ start: INITIAL_ELEMENT, end: -NUMBER_OF_INTERVAL }))

  const vms = useVm()
  const { getVms } = useVmApi()
  const { filterPool } = useAuth()

  const { data, fetchRequest, loading, reloading } = useFetch(getVms)

  useEffect(() => { fetchRequest({ start, end }) }, [filterPool])

  const handleGetMoreData = () => {
    console.log('FETCH MORE')

    setPage(prevState => {
      const newStart = prevState.start + NUMBER_OF_INTERVAL
      const newEnd = prevState.end - NUMBER_OF_INTERVAL

      fetchRequest({ start: newStart, end: newEnd })

      return { start: newStart, end: newEnd }
    })
  }

  const finish = data?.length < NUMBER_OF_INTERVAL
  // console.log({ start, end, loading, finish, vms })

  return (
    <Container disableGutters style={{ height: '100%' }}>
      <VmTable
        data={vms}
        isLoading={(vms.length === 0 && (loading || reloading))}
        finish={finish}
        getNextData={handleGetMoreData}
      />
    </Container>
  )
}

export default VirtualMachines
