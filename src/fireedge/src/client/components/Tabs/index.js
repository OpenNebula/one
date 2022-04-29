/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { useState, useMemo, ReactElement } from 'react'
import PropTypes from 'prop-types'

import {
  styled,
  Tabs as MTabs,
  TabsProps,
  Tab as MTab,
  Fade,
} from '@mui/material'
import { WarningCircledOutline } from 'iconoir-react'

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
}) => (
  <TabContent
    key={`tab-${id ?? name}`}
    data-cy={`tab-content-${id ?? name}`}
    hidden={hidden}
    border={addBorder}
  >
    <Fade in timeout={400}>
      <TabContent sx={{ p: '1em .5em' }}>
        {typeof RenderContent === 'function' ? (
          <RenderContent />
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

  const renderTabs = useMemo(
    () => (
      <MTabs
        value={tabSelected}
        variant="scrollable"
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
        {tabs.map(({ id, value, name, label, error, icon: Icon }, idx) => (
          <MTab
            key={`tab-${name}`}
            id={`tab-${name}`}
            icon={error ? <WarningIcon /> : Icon && <Icon />}
            value={value ?? idx}
            label={label ?? name}
            data-cy={`tab-${id}`}
          />
        ))}
      </MTabs>
    ),
    [tabs, tabSelected]
  )

  const renderAllHiddenTabContents = useMemo(
    () =>
      tabs.map((tabProps, idx) => {
        const { name, value = idx } = tabProps
        const hidden = tabSelected !== value

        return <Content key={`tab-${name}`} {...tabProps} hidden={hidden} />
      }),
    [tabSelected]
  )

  return (
    <>
      <Fade in timeout={300}>
        {renderTabs}
      </Fade>
      {renderHiddenTabs ? (
        renderAllHiddenTabContents
      ) : (
        <Content
          addBorder={addBorder}
          {...tabs.find(({ value }, idx) => (value ?? idx) === tabSelected)}
        />
      )}
    </>
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
}

export default Tabs
