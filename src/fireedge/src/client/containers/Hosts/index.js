import * as React from 'react'

import { Container, Box } from '@material-ui/core'

import * as Tables from 'client/components/Tables'

function Hosts () {
  return (
    <Box
      height={1}
      py={2}
      overflow='auto'
      display='flex'
      flexDirection='column'
      component={Container}
    >
      <Tables.HostsTable />
    </Box>
  )
}

export default Hosts
