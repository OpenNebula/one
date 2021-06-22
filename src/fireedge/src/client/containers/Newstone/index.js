import * as React from 'react'

import { useParams, useHistory } from 'react-router'
import { Redirect, Route, Switch, Link } from 'react-router-dom'

import { Container, Tabs, Tab, Box } from '@material-ui/core'

import {
  DatastoresTable,
  HostsTable,
  VmsTable,
  MarketplacesTable,
  MarketplaceAppsTable,
  ImagesTable
} from 'client/components/Tables'

import { PATH } from 'client/router/dev'

const TABS = {
  vms: PATH.NEWSTONE.replace(':resource', 'vms'),
  datastores: PATH.NEWSTONE.replace(':resource', 'datastores'),
  hosts: PATH.NEWSTONE.replace(':resource', 'hosts'),
  marketplaces: PATH.NEWSTONE.replace(':resource', 'marketplaces'),
  apps: PATH.NEWSTONE.replace(':resource', 'apps'),
  images: PATH.NEWSTONE.replace(':resource', 'images')
}

const Newstone = () => {
  const history = useHistory()
  const { resource } = useParams()

  const renderTabs = React.useMemo(() => (
    <Tabs
      style={{ borderBottom: '1px solid #e8e8e8' }}
      value={resource}
      variant='scrollable'
      scrollButtons='auto'
    >
      {Object.keys(TABS).map(tabName =>
        <Tab
          key={`tab-${tabName}`}
          label={tabName}
          value={tabName}
          component={Link}
          to={tabName}
        />
      )}
    </Tabs>
  ), [resource])

  return (
    <Container>
      {Object.values(TABS).includes(history.location.pathname) && renderTabs}

      <Box py={2} overflow='auto'>
        <Switch>
          <Route exact path={TABS.vms} component={VmsTable} />
          <Route exact path={TABS.datastores} component={DatastoresTable} />
          <Route exact path={TABS.hosts} component={HostsTable} />
          <Route exact path={TABS.marketplaces} component={MarketplacesTable} />
          <Route exact path={TABS.apps} component={MarketplaceAppsTable} />
          <Route exact path={TABS.images} component={ImagesTable} />

          <Route component={() => <Redirect to={TABS.vms} />} />
        </Switch>
      </Box>
    </Container>
  )
}

export default Newstone
