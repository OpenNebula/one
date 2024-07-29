/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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

import {
  InfoEmpty as IconIcon,
  Settings as SettingsIcon,
  Page as LogIcon,
  Calendar as ActionsIcons,
} from 'iconoir-react'

import { AppBar, Tabs, Tab, Box } from '@mui/material'

import CustomDialog from 'client/containers/ApplicationsInstances/DialogInfo/dialog'
import InfoTab from 'client/containers/ApplicationsInstances/DialogInfo/info'
import TiersTab from 'client/containers/ApplicationsInstances/DialogInfo/tiers'

const TABS = [
  { name: 'info', icon: IconIcon, content: InfoTab },
  { name: 'tiers', icon: SettingsIcon, content: TiersTab },
  { name: 'log', icon: LogIcon },
  { name: 'actions', icon: ActionsIcons },
]

const DialogInfo = ({ info, handleClose }) => {
  const [tabSelected, setTab] = useState(0)
  const { name } = info?.TEMPLATE?.BODY

  // Removed memoization, might need to optimize later
  const renderTabs = (
    <AppBar position="static">
      <Tabs
        value={tabSelected}
        variant="scrollable"
        scrollButtons="auto"
        onChange={(_, tab) => setTab(tab)}
      >
        {TABS.map(({ name: tabName, icon: Icon }, idx) => (
          <Tab
            key={`tab-${tabName}`}
            id={`tab-${tabName}`}
            icon={<Icon />}
            value={idx}
            label={String(tabName).toUpperCase()}
          />
        ))}
      </Tabs>
    </AppBar>
  )

  return (
    <CustomDialog title={name} handleClose={handleClose}>
      {renderTabs}
      {useMemo(
        () =>
          TABS.map(({ name: tabName, content: Content }, idx) => (
            <Box
              p={2}
              height={1}
              overflow="auto"
              key={`tab-${tabName}`}
              hidden={tabSelected !== idx}
            >
              {Content !== undefined ? (
                <Content info={info} />
              ) : (
                <h1>{tabName}</h1>
              )}
            </Box>
          )),
        [tabSelected]
      )}
    </CustomDialog>
  )
}

DialogInfo.propTypes = {
  info: PropTypes.object.isRequired,
  handleClose: PropTypes.func,
}

DialogInfo.defaultProps = {
  info: {},
  handleClose: undefined,
}

export default DialogInfo
