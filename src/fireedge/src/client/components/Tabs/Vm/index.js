import * as React from 'react'
import PropTypes from 'prop-types'

import { useAuth } from 'client/features/Auth'

import Tabs from 'client/components/Tabs'
import { stringToCamelCase, stringToCamelSpace } from 'client/utils'

import Capacity from 'client/components/Tabs/Vm/Capacity'
import Configuration from 'client/components/Tabs/Vm/Configuration'
import Info from 'client/components/Tabs/Vm/Info'
import Log from 'client/components/Tabs/Vm/Log'
import Network from 'client/components/Tabs/Vm/Network'
import Placement from 'client/components/Tabs/Vm/Placement'
import SchedActions from 'client/components/Tabs/Vm/SchedActions'
import Snapshot from 'client/components/Tabs/Vm/Snapshot'
import Storage from 'client/components/Tabs/Vm/Storage'

const loadTab = tabName => ({
  capacity: Capacity,
  configuration: Configuration,
  info: Info,
  log: Log,
  network: Network,
  placement: Placement,
  schedActions: SchedActions,
  snapshot: Snapshot,
  storage: Storage
}[tabName])

const VmTabs = ({ data }) => {
  const [tabsAvailable, setTabs] = React.useState(() => [])
  const { view, getResourceView } = useAuth()

  React.useEffect(() => {
    const infoTabs = getResourceView('VM')?.['info-tabs'] ?? {}

    setTabs(() => Object.entries(infoTabs)
      ?.filter(([_, { enabled } = {}]) => !!enabled)
      ?.map(([tabName, tabProps]) => {
        const nameSanitize = stringToCamelCase(tabName)
        const TabContent = loadTab(nameSanitize)

        return TabContent && {
          name: stringToCamelSpace(nameSanitize),
          renderContent: props => TabContent({ ...props, tabProps })
        }
      })
      ?.filter(Boolean))
  }, [view])

  return <Tabs tabs={tabsAvailable} data={data} />
}

VmTabs.propTypes = {
  data: PropTypes.object.isRequired
}

VmTabs.displayName = 'VmTabs'

export default VmTabs
