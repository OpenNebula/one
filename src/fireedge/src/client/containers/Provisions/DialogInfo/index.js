/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
/* eslint-disable jsdoc/require-jsdoc */
import { useState, useMemo } from 'react'
import PropTypes from 'prop-types'

import { AppBar, Tabs, Tab, Box } from '@mui/material'
import {
  InfoEmpty as InfoIcon,
  HardDrive as HostIcon,
  Folder as DatastoreIcon,
  NetworkAlt as NetworkIcon,
  Page as LogIcon
} from 'iconoir-react'

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

const DialogInfo = ({ disableAllActions, fetchProps }) => {
  const [tabSelected, setTab] = useState(0)
  const { data, fetchRequest, reloading } = fetchProps

  const renderTabs = useMemo(() => (
    <AppBar position='static'>
      <Tabs
        value={tabSelected}
        variant='scrollable'
        scrollButtons='auto'
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
            overflow='auto'
          >
            <Content
              data={data}
              hidden={tabSelected !== idx}
              disableAllActions={disableAllActions}
              refetchProvision={() => fetchRequest(undefined, { reload: true })}
              reloading={reloading}
            />
          </Box>
        )), [tabSelected, reloading])}
    </>
  )
}

DialogInfo.propTypes = {
  disableAllActions: PropTypes.bool,
  fetchProps: PropTypes.shape({
    data: PropTypes.object.isRequired,
    fetchRequest: PropTypes.func,
    reloading: PropTypes.bool
  }).isRequired
}

DialogInfo.defaultProps = {
  disableAllActions: false,
  fetchProps: {
    data: {},
    fetchRequest: undefined,
    reloading: false
  }
}

export default DialogInfo
