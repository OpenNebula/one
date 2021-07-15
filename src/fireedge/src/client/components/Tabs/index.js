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
import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Tabs as MTabs, Tab as MTab } from '@material-ui/core'

const Content = ({ name, renderContent: Content, hidden }) => (
  <div key={`tab-${name}`}
    style={{
      padding: 2,
      height: '100%',
      overflow: 'auto',
      display: hidden ? 'none' : 'block'
    }}
  >
    {typeof Content === 'function' ? <Content /> : Content}
  </div>
)

const Tabs = ({ tabs = [], renderHiddenTabs = false }) => {
  const [tabSelected, setTab] = useState(0)

  const renderTabs = useMemo(() => (
    <MTabs
      value={tabSelected}
      variant='scrollable'
      scrollButtons='auto'
      onChange={(_, tab) => setTab(tab)}
    >
      {tabs.map(({ value, name, icon: Icon }, idx) =>
        <MTab
          key={`tab-${name}`}
          id={`tab-${name}`}
          icon={Icon && <Icon />}
          value={value ?? idx}
          label={String(name).toUpperCase()}
        />
      )}
    </MTabs>
  ), [tabs.length, tabSelected])

  const renderAllHiddenTabContents = useMemo(() =>
    tabs.map((tabProps, idx) => {
      const { name, value = idx } = tabProps
      const hidden = tabSelected !== value

      return <Content key={`tab-${name}`} {...tabProps} hidden={hidden} />
    }), [tabSelected])

  return (
    <>
      {renderTabs}
      {renderHiddenTabs ? (
        renderAllHiddenTabContents
      ) : (
        <Content {...tabs.find(({ value }, idx) => (value ?? idx) === tabSelected)} />
      )}
    </>
  )
}

Tabs.displayName = 'Tabs'
Content.displayName = 'Content'

Tabs.propTypes = {
  tabs: PropTypes.array,
  renderHiddenTabs: PropTypes.bool
}

Content.propTypes = {
  name: PropTypes.string,
  renderContent: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.func
  ]),
  hidden: PropTypes.bool
}

export default Tabs
