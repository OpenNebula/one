/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

import React, { useState } from 'react'

import { Tab, Tabs, Paper, Container } from '@material-ui/core'

import ApplicationsTemplatesList from 'client/containers/Applications/List/Templates'
import ApplicationsDeployed from 'client/containers/Applications/List/Deployed'

const TABS = {
  TEMPLATES: 'templates',
  APPLICATIONS: 'applications'
}

function Applications () {
  const [value, setValue] = useState(TABS.TEMPLATES)

  const handleChange = (_, newValue) => {
    setValue(newValue)
  }

  return (
    <Container
      disableGutters
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Paper>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            value={TABS.TEMPLATES}
            label="Applications templates"
            id={`tab-${TABS.TEMPLATES}`}
          />
          <Tab
            value={TABS.APPLICATIONS}
            label="Applications deployed"
            id={`tab-${TABS.APPLICATIONS}`}
          />
        </Tabs>
      </Paper>
      <div hidden={value !== TABS.TEMPLATES}>
        {value === TABS.TEMPLATES && <ApplicationsTemplatesList />}
      </div>
      <div hidden={value !== TABS.APPLICATIONS}>
        {value === TABS.APPLICATIONS && <ApplicationsDeployed />}
      </div>
    </Container>
  )
}

Applications.propTypes = {}

Applications.defaultProps = {}

export default Applications
