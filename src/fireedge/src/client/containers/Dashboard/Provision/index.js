import * as React from 'react'

import { Box, Container, Typography } from '@material-ui/core'

import { ListCards } from 'client/components/List'
import { WidgetCard } from 'client/components/Cards'
import * as Widgets from 'client/components/Widgets'

import dashboardStyles from 'client/containers/Dashboard/Provision/styles'
import { Tr } from 'client/components/HOC/Translate'
import { T } from 'client/constants'

function Dashboard () {
  const classes = dashboardStyles()
  const widgets = [
    Widgets.TotalProviders(),
    Widgets.TotalProvisions()
  ]

  return (
    <Container disableGutters>
      <Box p={3}>
        <Typography
          variant="h2"
          className={classes.title}
          data-cy="dashboard-title"
        >
          {Tr(T.Dashboard)}
        </Typography>
        <Box py={3}>
          <ListCards
            list={widgets}
            keyProp='cy'
            CardComponent={WidgetCard}
            breakpoints={{ xs: 12, sm: 6 }}
          />
        </Box>
      </Box>
    </Container>
  )
}

export default Dashboard
