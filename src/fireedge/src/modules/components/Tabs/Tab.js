/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useState, useMemo } from 'react'

import {
  Tab as MTab,
  Tabs as MTabs,
  Stack,
  TabsProps,
  useTheme,
  Box,
  Tooltip,
  Typography,
} from '@mui/material'
import { WarningCircledOutline } from 'iconoir-react'
import { Tr } from '@modules/components/HOC'
import TabStyles from '@modules/components/Tabs/TabStyles'

const Content = ({
  id,
  name,
  renderContent: RenderContent,
  hidden,
  addBorder = false,
  setTab,
  logTabId,
}) => {
  const theme = useTheme()
  const classes = useMemo(
    () => TabStyles(theme, hidden, addBorder ? 'true' : undefined),
    [theme, hidden, addBorder]
  )

  return (
    <div
      key={`tab-${id ?? name}`}
      data-cy={`tab-content-${id ?? name}`}
      className={classes.tabContent}
    >
      {typeof RenderContent === 'function' ? (
        <RenderContent setTab={setTab} logTabId={logTabId} />
      ) : (
        RenderContent
      )}
    </div>
  )
}

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

  const theme = useTheme()
  const classes = useMemo(() => TabStyles(theme), [theme])

  // Removed memoization, might need to optimize later
  const renderTabs = (
    <MTabs
      value={tabSelected}
      variant="scrollable"
      allowScrollButtonsMobile
      scrollButtons="auto"
      onChange={(_, tab) => setTab(tab)}
      sx={{
        ...sx,
      }}
      className={classes.tabTitle}
      {...tabsProps}
    >
      {tabs.map(
        (
          {
            value,
            name,
            id = name,
            label,
            error,
            icon: Icon,
            tooltip,
            disabled,
          },
          idx
        ) => {
          const tabElement = (
            <MTab
              key={`tab-${id}`}
              id={`tab-${id}`}
              iconPosition="start"
              icon={
                error ? (
                  <WarningCircledOutline className={classes.warningIcon} />
                ) : (
                  Icon && <Icon />
                )
              }
              value={value ?? idx}
              label={Tr(label) ?? id}
              data-cy={`tab-${id}`}
              disabled={disabled}
            />
          )

          return tooltip ? (
            <Tooltip
              key={`tooltip-${id}`}
              title={<Typography variant="subtitle2">{Tr(tooltip)}</Typography>}
              arrow
              placement="bottom"
            >
              <span>{tabElement}</span>
            </Tooltip>
          ) : (
            tabElement
          )
        }
      )}
    </MTabs>
  )

  const logTabId = tabs
    .map(function (tabProps) {
      return tabProps.name
    })
    .indexOf('log')

  return (
    <Stack style={{ height: 'auto' }}>
      {renderTabs}
      {renderHiddenTabs ? (
        tabs.map((tabProps, idx) => {
          const { name, value = idx } = tabProps
          const hidden = tabSelected !== value

          return <Content key={`tab-${name}`} {...tabProps} hidden={hidden} />
        })
      ) : (
        <Box className={classes.containerContent}>
          <Content
            addBorder={addBorder}
            setTab={setTab}
            {...tabs.find(({ value }, idx) => (value ?? idx) === tabSelected)}
            logTabId={logTabId}
          />
        </Box>
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
  isFullMode: PropTypes.bool,
}

export default Tabs
