import * as React from 'react'

import { styled, Container as MContainer, Box } from '@material-ui/core'

import * as Tables from 'client/components/Tables'

const Container = styled(MContainer)`
  display: flex;
  flexDirection: column;
  height: 100%
`

function Marketplaces () {
  return (
    <Container disableGutters>
      <Box py={2} overflow='auto'>
        <Tables.MarketplacesTable />
      </Box>
    </Container>
  )
}

export default Marketplaces
