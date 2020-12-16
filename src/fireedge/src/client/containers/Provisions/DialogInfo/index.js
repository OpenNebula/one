import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'

import { AppBar, Tabs, Tab, Box } from '@material-ui/core'
import InfoIcon from '@material-ui/icons/Info'
import DatastoreIcon from '@material-ui/icons/FolderOpen'
import NetworkIcon from '@material-ui/icons/AccountTree'
import HostIcon from '@material-ui/icons/VideogameAsset'
import LogIcon from '@material-ui/icons/InsertDriveFile'

import InfoTab from 'client/containers/Provisions/DialogInfo/info'
import DatastoresTab from 'client/containers/Provisions/DialogInfo/datastores'
import NetworksTab from 'client/containers/Provisions/DialogInfo/networks'
import HostsTab from 'client/containers/Provisions/DialogInfo/hosts'
import LogTab from 'client/containers/Provisions/DialogInfo/log'

const TABS = [
  { name: 'info', icon: InfoIcon, content: InfoTab },
  { name: 'datastores', icon: DatastoreIcon, content: DatastoresTab },
  { name: 'networks', icon: NetworkIcon, content: NetworksTab },
  { name: 'hosts', icon: HostIcon, content: HostsTab },
  { name: 'log', icon: LogIcon, content: LogTab }
]

const DialogInfo = ({ data, ...methods }) => {
  const [tabSelected, setTab] = useState(0)

  const renderTabs = useMemo(() => (
    <AppBar position="static">
      <Tabs
        value={tabSelected}
        variant="scrollable"
        scrollButtons="auto"
        onChange={(_, tab) => setTab(tab)}
      >
        {TABS.map(({ name, icon: Icon }, idx) =>
          <Tab
            key={`tab-${name}`}
            id={`tab-${name}`}
            icon={<Icon />}
            value={idx}
            label={String(name).toUpperCase()}
          />
        )}
      </Tabs>
    </AppBar>
  ), [tabSelected])

  return (
    <>
      {renderTabs}
      {useMemo(() =>
        TABS.map(({ name, content: Content }, idx) => (
          <Box p={2}
            height={1}
            hidden={tabSelected !== idx}
            key={`tab-${name}`}
            overflow="auto"
          >
            <Content
              data={data}
              hidden={tabSelected !== idx}
              {...methods}
            />
          </Box>
        )), [tabSelected, data])}
    </>
  )
}

DialogInfo.propTypes = {
  data: PropTypes.object.isRequired,
  fetchRequest: PropTypes.func
}

DialogInfo.defaultProps = {
  data: {},
  fetchRequest: undefined
}

export default DialogInfo
