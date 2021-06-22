import React, { useState, useMemo, memo } from 'react'
import PropTypes from 'prop-types'

import { Tabs as MTabs, Tab as MTab } from '@material-ui/core'

const Content = memo(({ name, renderContent, hidden }) => (
  <div key={`tab-${name}`}
    style={{
      padding: 2,
      height: '100%',
      overflow: 'auto',
      display: hidden ? 'none' : 'block'
    }}
  >
    {typeof renderContent === 'function' ? renderContent() : renderContent}
  </div>
), (prev, next) => prev.hidden === next.hidden)

const Tabs = ({ tabs = [] }) => {
  const [tabSelected, setTab] = useState(0)

  const renderTabs = useMemo(() => (
    <MTabs
      value={tabSelected}
      variant="scrollable"
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
  ), [tabSelected])

  const renderTabContent = useMemo(() =>
    tabs.map((tabProps, idx) => {
      const { name, value = idx } = tabProps
      const hidden = tabSelected !== value

      return <Content key={`tab-${name}`} {...tabProps} hidden={hidden} />
    }), [tabSelected])

  return (
    <>
      {renderTabs}
      {renderTabContent}
    </>
  )
}

Tabs.displayName = 'Tabs'
Content.displayName = 'Content'

Content.propTypes = {
  name: PropTypes.string,
  renderContent: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.func
  ]),
  hidden: PropTypes.bool
}

export default Tabs
