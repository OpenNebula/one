import * as React from 'react'

import { useParams, useHistory } from 'react-router'
import { Redirect, Route, Switch, Link } from 'react-router-dom'

import { withStyles, Container, Tabs, Tab, Box } from '@material-ui/core'

import {
  DatastoresTable,
  HostsTable,
  VmsTable
} from 'client/components/Tables'
import { PATH } from 'client/router/dev'

const TABS = {
  vms: PATH.NEWSTONE.replace(':resource', 'vms'),
  datastores: PATH.NEWSTONE.replace(':resource', 'datastores'),
  hosts: PATH.NEWSTONE.replace(':resource', 'hosts')
}

const AntTabs = withStyles(theme => ({
  root: {
    borderBottom: '1px solid #e8e8e8'
  },
  indicator: {
    backgroundColor: theme.palette.secondary.main
  }
}))(Tabs)

const AntTab = withStyles(theme => ({
  root: {
    minWidth: 72,
    fontWeight: theme.typography.fontWeightRegular,
    marginRight: theme.spacing(4),
    '&:hover': {
      color: theme.palette.secondary.light,
      opacity: 1
    },
    '&$selected': {
      color: theme.palette.secondary.main,
      fontWeight: theme.typography.fontWeightMedium
    },
    '&:focus': {
      color: theme.palette.secondary.light
    }
  },
  selected: {}
}))(props => <Tab disableRipple {...props} />)

const AntContainer = withStyles({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    paddingInline: 0
  }
})(Container)

const Newstone = () => {
  const history = useHistory()
  const { resource } = useParams()

  const renderTabs = React.useMemo(() => (
    <AntTabs
      value={resource}
      variant='scrollable'
      scrollButtons='auto'
    >
      {Object.keys(TABS).map(tabName =>
        <AntTab
          key={`tab-${tabName}`}
          label={tabName}
          value={tabName}
          component={Link}
          to={tabName}
        />
      )}
    </AntTabs>
  ), [resource])

  return (
    <AntContainer>
      {Object.values(TABS).includes(history.location.pathname) && renderTabs}

      <Box py={2} overflow='auto'>
        <Switch>
          <Route path={TABS.vms} component={VmsTable} />
          <Route path={TABS.datastores} component={DatastoresTable} />
          <Route path={TABS.hosts} component={HostsTable} />

          <Route component={() => <Redirect to={TABS.vms} />} />
        </Switch>
      </Box>
    </AntContainer>
  )
}

export default Newstone
