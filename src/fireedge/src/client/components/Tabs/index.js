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
import PropTypes from 'prop-types'
import { ReactElement, useState } from 'react'

import {
  Fade,
  Tab as MTab,
  Tabs as MTabs,
  Stack,
  TabsProps,
  styled,
} from '@mui/material'
import { WarningCircledOutline } from 'iconoir-react'
import { Tr } from 'client/components/HOC'

const WarningIcon = styled(WarningCircledOutline)(({ theme }) => ({
  color: theme.palette.error.main,
}))

const TabContent = styled('div')(({ hidden, border, theme }) => ({
  height: '100%',
  display: hidden ? 'none' : 'flex',
  flexDirection: 'column',
  overflow: 'auto',
  ...(border && {
    backgroundColor: theme.palette.background.paper,
    border: `thin solid ${theme.palette.secondary.main}`,
    borderTop: 'none',
    borderRadius: `0 0 8px 8px`,
  }),
}))

const Content = ({
  id,
  name,
  renderContent: RenderContent,
  hidden,
  addBorder = false,
  setTab,
  logTabId,
}) => (
  <TabContent
    key={`tab-${id ?? name}`}
    data-cy={`tab-content-${id ?? name}`}
    hidden={hidden}
    border={addBorder ? 'true' : undefined}
  >
    <Fade in timeout={400}>
      <TabContent sx={{ p: '1em .5em' }}>
        {typeof RenderContent === 'function' ? (
          <RenderContent setTab={setTab} logTabId={logTabId} />
        ) : (
          RenderContent
        )}
      </TabContent>
    </Fade>
  </TabContent>
)

/**
 * @param {object} props - Props
 * @param {Array} props.tabs - Tabs
 * @param {TabsProps} props.tabsProps - Props to tabs component
 * @param {boolean} [props.renderHiddenTabs] - If `true`, will be render hidden tabs
 * @param {boolean} [props.addBorder] - If `true`, will be add a border to tab content
 * @returns {ReactElement} Tabs component with content
 */
const Tabs = ({
  tabs = [],
  tabsProps: { sx, ...tabsProps } = {},
  renderHiddenTabs = false,
  addBorder = false,
}) => {
  const [tabSelected, setTab] = useState(() => 0)

  // Removed memoization, might need to optimize later
  const renderTabs = (
    <MTabs
      value={tabSelected}
      variant="scrollable"
      allowScrollButtonsMobile
      scrollButtons="auto"
      onChange={(_, tab) => setTab(tab)}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: ({ zIndex }) => zIndex.appBar,
        ...sx,
      }}
      {...tabsProps}
    >
      {tabs.map(({ value, name, id = name, label, error, icon: Icon }, idx) => (
        <MTab
          key={`tab-${id}`}
          id={`tab-${id}`}
          iconPosition="start"
          icon={error ? <WarningIcon /> : Icon && <Icon />}
          value={value ?? idx}
          label={Tr(label) ?? id}
          data-cy={`tab-${id}`}
        />
      ))}
    </MTabs>
  )

  const logTabId = tabs
    .map(function (tabProps) {
      return tabProps.name
    })
    .indexOf('log')

  return (
    <Stack height={1} overflow="auto">
      <Fade in timeout={300}>
        {renderTabs}
      </Fade>
      {renderHiddenTabs ? (
        tabs.map((tabProps, idx) => {
          const { name, value = idx } = tabProps
          const hidden = tabSelected !== value

          return <Content key={`tab-${name}`} {...tabProps} hidden={hidden} />
        })
      ) : (
        <Content
          addBorder={addBorder}
          setTab={setTab}
          {...tabs.find(({ value }, idx) => (value ?? idx) === tabSelected)}
          logTabId={logTabId}
        />
      )}
    </Stack>
  )
}

Tabs.displayName = 'Tabs'
Content.displayName = 'Content'

Tabs.propTypes = {
  tabs: PropTypes.array,
  tabsProps: PropTypes.object,
  renderHiddenTabs: PropTypes.bool,
  addBorder: PropTypes.bool,
}

Content.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  name: PropTypes.string,
  renderContent: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  hidden: PropTypes.bool,
  addBorder: PropTypes.bool,
  setTab: PropTypes.func,
  logTabId: PropTypes.number,
}

export default Tabs
