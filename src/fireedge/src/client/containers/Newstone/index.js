import * as React from 'react'

import { useParams, useHistory } from 'react-router'
import { Redirect, Route, Switch, Link } from 'react-router-dom'

import { Container, Tabs, Tab, Box } from '@material-ui/core'

import * as Tables from 'client/components/Tables'

import { PATH } from 'client/router/dev'

const TABS = {
  apps: PATH.NEWSTONE.replace(':resource', 'apps'),
  clusters: PATH.NEWSTONE.replace(':resource', 'clusters'),
  datastores: PATH.NEWSTONE.replace(':resource', 'datastores'),
  hosts: PATH.NEWSTONE.replace(':resource', 'hosts'),
  images: PATH.NEWSTONE.replace(':resource', 'images'),
  marketplaces: PATH.NEWSTONE.replace(':resource', 'marketplaces'),
  vms: PATH.NEWSTONE.replace(':resource', 'vms')
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
          <Route exact path={TABS.apps} component={Tables.MarketplaceAppsTable} />
          <Route exact path={TABS.clusters} component={Tables.ClustersTable} />
          <Route exact path={TABS.datastores} component={Tables.DatastoresTable} />
          <Route exact path={TABS.hosts} component={Tables.HostsTable} />
          <Route exact path={TABS.images} component={Tables.ImagesTable} />
          <Route exact path={TABS.marketplaces} component={Tables.MarketplacesTable} />
          <Route exact path={TABS.vms} component={Tables.VmsTable} />

          <Route component={() => <Redirect to={TABS.vms} />} />
        </Switch>
      </Box>
    </Container>
  )
}

export default Newstone
