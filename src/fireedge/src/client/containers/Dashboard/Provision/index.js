import * as React from 'react'

import { Box, Container } from '@material-ui/core'

import { ListCards } from 'client/components/List'
import { WidgetCard } from 'client/components/Cards'
import * as Widgets from 'client/components/Widgets'

function Dashboard () {
  const widgets = [
    Widgets.TotalProviders(),
    Widgets.TotalProvisions()
  ]

  return (
    <Container disableGutters>
      <Box py={3}>
        <ListCards
          list={widgets}
          keyProp='cy'
          CardComponent={WidgetCard}
          breakpoints={{ xs: 12, sm: 6 }}
        />
      </Box>
    </Container>
  )
}

export default Dashboard
