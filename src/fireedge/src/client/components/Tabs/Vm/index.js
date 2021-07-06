import * as React from 'react'
import PropTypes from 'prop-types'
import loadable from '@loadable/component'

import { useAuth } from 'client/features/Auth'

import Tabs from 'client/components/Tabs'
import { stringToCamelCase, stringToCamelSpace } from 'client/utils'

const Capacity = loadable(() => import('client/components/Tabs/Vm/capacity'))
const Configuration = loadable(() => import('client/components/Tabs/Vm/configuration'))
const Info = loadable(() => import('client/components/Tabs/Vm/info'))
const Log = loadable(() => import('client/components/Tabs/Vm/log'))
const Network = loadable(() => import('client/components/Tabs/Vm/network'))
const Placement = loadable(() => import('client/components/Tabs/Vm/placement'))
const SchedActions = loadable(() => import('client/components/Tabs/Vm/schedActions'))
const Snapshot = loadable(() => import('client/components/Tabs/Vm/snapshot'))
const Storage = loadable(() => import('client/components/Tabs/Vm/storage'))

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

    const tabs = Object.entries(infoTabs)
      ?.map(([tabName, { enabled } = {}]) => !!enabled && tabName)
      ?.filter(Boolean)

    setTabs(() => tabs.map(tabName => {
      const nameSanitize = stringToCamelCase(tabName)
      const TabContent = loadTab(nameSanitize)

      return TabContent && {
        name: stringToCamelSpace(nameSanitize),
        renderContent: props => TabContent.render({ ...props })
      }
    }).filter(Boolean))
  }, [view])

  return <Tabs tabs={tabsAvailable} data={data} />
}

VmTabs.propTypes = {
  data: PropTypes.object.isRequired
}

VmTabs.displayName = 'VmTabs'

export default VmTabs
