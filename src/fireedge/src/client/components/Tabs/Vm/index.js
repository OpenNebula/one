import * as React from 'react'
import PropTypes from 'prop-types'

import Tabs from 'client/components/Tabs'

const stringToCamelCase = s =>
  s.replace(
    /([-_][a-z])/ig,
    $1 => $1.toUpperCase()
      .replace('-', '')
      .replace('_', '')
  )

const stringToCamelSpace = s => s.replace(/([a-z])([A-Z])/g, '$1 $2')

const VmTabs = ({ data, tabs }) => {
  const [renderTabs, setTabs] = React.useState(() => [])

  React.useEffect(() => {
    const loadTab = async tabKey => {
      try {
        const camelCaseKey = stringToCamelCase(tabKey)

        // dynamic import => client/components/Tabs/Vm
        const tabComponent = await import(`./${camelCaseKey}`)

        setTabs(prev => prev.concat([{
          name: stringToCamelSpace(camelCaseKey),
          renderContent: tabComponent.default(data)
        }]))
      } catch (error) {}
    }

    // reset
    setTabs([])

    tabs?.forEach(loadTab)
  }, [tabs?.length])

  return <Tabs tabs={renderTabs} />
}

VmTabs.propTypes = {
  data: PropTypes.object.isRequired,
  tabs: PropTypes.arrayOf(
    PropTypes.string
  ).isRequired
}

VmTabs.displayName = 'VmTabs'

export default VmTabs
