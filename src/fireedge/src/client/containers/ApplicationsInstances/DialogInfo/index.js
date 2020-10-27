import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Info, Build, Description, Today } from '@material-ui/icons'
import { AppBar, Tabs, Tab, Box } from '@material-ui/core'

import CustomDialog from 'client/containers/ApplicationsInstances/DialogInfo/dialog'
import InfoTab from 'client/containers/ApplicationsInstances/DialogInfo/info'
import TiersTab from 'client/containers/ApplicationsInstances/DialogInfo/tiers'

const TABS = [
  { name: 'info', icon: Info, content: InfoTab },
  { name: 'tiers', icon: Build, content: TiersTab },
  { name: 'log', icon: Description },
  { name: 'actions', icon: Today }
]

const DialogInfo = ({ info, handleClose }) => {
  const [tabSelected, setTab] = useState(0)
  const { name } = info?.TEMPLATE?.BODY

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
    <CustomDialog title={name} handleClose={handleClose}>
      {renderTabs}
      {useMemo(() =>
        TABS.map(({ name, content: Content }, idx) => (
          <Box
            p={2}
            height={1}
            overflow="auto"
            key={`tab-${name}`}
            hidden={tabSelected !== idx}
          >
            {Content !== undefined ? (
              <Content info={info} />
            ) : (
              <h1>{name}</h1>
            )
            }
          </Box>
        )), [tabSelected])}
    </CustomDialog>
  )
}

DialogInfo.propTypes = {
  info: PropTypes.object.isRequired,
  handleClose: PropTypes.func
}

DialogInfo.defaultProps = {
  info: {},
  handleClose: undefined
}

export default DialogInfo
