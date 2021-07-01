import {
  ReportColumns as DashboardIcon,
  Settings as SettingsIcon,

  Cell4x4 as InstancesIcons,
  ModernTv as VmsIcons,
  Shuffle as VRoutersIcons,

  Archive as TemplatesIcon,
  GoogleDocs as TemplateIcon,

  Box as StorageIcon,
  Db as DatastoreIcon,
  BoxIso as ImageIcon,
  SimpleCart as MarketplaceIcon,
  CloudDownload as MarketplaceAppIcon,

  ServerConnection as NetworksIcon,
  NetworkAlt as NetworkIcon,
  KeyframesCouple as NetworkTemplateIcon,

  CloudSync as InfrastructureIcon,
  Server as ClusterIcon,
  HardDrive as HostIcon,
  MinusPinAlt as ZoneIcon,

  Home as SystemIcon,
  User as UserIcon,
  Group as GroupIcon

} from 'iconoir-react'

import loadable from '@loadable/component'

const Dashboard = loadable(() => import('client/containers/Dashboard/Sunstone'), { ssr: false })
const Settings = loadable(() => import('client/containers/Settings'), { ssr: false })

const VirtualMachines = loadable(() => import('client/containers/VirtualMachines'), { ssr: false })
const VirtualRouters = loadable(() => import('client/containers/VirtualRouters'), { ssr: false })

const VmTemplates = loadable(() => import('client/containers/VmTemplates'), { ssr: false })
// const VrTemplates = loadable(() => import('client/containers/VrTemplates'), { ssr: false })
// const VmGroups = loadable(() => import('client/containers/VmGroups'), { ssr: false })

const Datastores = loadable(() => import('client/containers/Datastores'), { ssr: false })
const Images = loadable(() => import('client/containers/Images'), { ssr: false })
// const Files = loadable(() => import('client/containers/Files'), { ssr: false })
const Marketplaces = loadable(() => import('client/containers/Marketplaces'), { ssr: false })
const MarketplaceApps = loadable(() => import('client/containers/MarketplaceApps'), { ssr: false })

const VirtualNetworks = loadable(() => import('client/containers/VirtualNetworks'), { ssr: false })
const VNetworkTemplates = loadable(() => import('client/containers/VNetworkTemplates'), { ssr: false })
// const NetworkTopologies = loadable(() => import('client/containers/NetworkTopologies'), { ssr: false })
// const SecurityGroups = loadable(() => import('client/containers/SecurityGroups'), { ssr: false })

const Clusters = loadable(() => import('client/containers/Clusters'), { ssr: false })
const Hosts = loadable(() => import('client/containers/Hosts'), { ssr: false })
const Zones = loadable(() => import('client/containers/Zones'), { ssr: false })

const Users = loadable(() => import('client/containers/Users'), { ssr: false })
const Groups = loadable(() => import('client/containers/Groups'), { ssr: false })
// const VDCs = loadable(() => import('client/containers/VDCs'), { ssr: false })
// const ACLs = loadable(() => import('client/containers/ACLs'), { ssr: false })

export const PATH = {
  DASHBOARD: '/dashboard',
  INSTANCE: {
    VMS: {
      LIST: '/vms'
    },
    VROUTERS: {
      LIST: '/virtual-routers'
    }
  },
  TEMPLATE: {
    VMS: {
      LIST: '/vm-templates'
    }
  },
  STORAGE: {
    DATASTORES: {
      LIST: '/datastores'
    },
    IMAGES: {
      LIST: '/images'
    },
    FILES: {
      LIST: '/files'
    },
    MARKETPLACES: {
      LIST: '/marketplaces'
    },
    MARKETPLACE_APPS: {
      LIST: '/marketplaces-apps'
    }
  },
  NETWORK: {
    VNETS: {
      LIST: '/virtual-networks'
    },
    VN_TEMPLATES: {
      LIST: '/network-templates'
    },
    SEC_GROUPS: {
      LIST: '/security-groups'
    }
  },
  INFRASTRUCTURE: {
    CLUSTERS: {
      LIST: '/clusters'
    },
    HOSTS: {
      LIST: '/hosts'
    },
    ZONES: {
      LIST: '/zones'
    }
  },
  SYSTEM: {
    USERS: {
      LIST: '/users'
    },
    GROUPS: {
      LIST: '/groups'
    }
  },
  SETTINGS: '/settings'
}

export const ENDPOINTS = [
  {
    label: 'Dashboard',
    path: PATH.DASHBOARD,
    sidebar: true,
    icon: DashboardIcon,
    Component: Dashboard
  },
  {
    label: 'Instances',
    sidebar: true,
    icon: InstancesIcons,
    routes: [
      {
        label: 'VMs',
        path: PATH.INSTANCE.VMS.LIST,
        sidebar: true,
        icon: VmsIcons,
        Component: VirtualMachines
      },
      {
        label: 'Virtual Routers',
        path: PATH.INSTANCE.VROUTERS.LIST,
        sidebar: true,
        icon: VRoutersIcons,
        Component: VirtualRouters
      }
    ]
  },
  {
    label: 'Templates',
    sidebar: true,
    icon: TemplatesIcon,
    routes: [
      {
        label: 'VMs',
        path: PATH.TEMPLATE.VMS.LIST,
        sidebar: true,
        icon: TemplateIcon,
        Component: VmTemplates
      }
    ]
  },
  {
    label: 'Storage',
    sidebar: true,
    icon: StorageIcon,
    routes: [
      {
        label: 'Datastores',
        path: PATH.STORAGE.DATASTORES.LIST,
        sidebar: true,
        icon: DatastoreIcon,
        Component: Datastores
      },
      {
        label: 'Images',
        path: PATH.STORAGE.IMAGES.LIST,
        sidebar: true,
        icon: ImageIcon,
        Component: Images
      },
      {
        label: 'Marketplaces',
        path: PATH.STORAGE.MARKETPLACES.LIST,
        sidebar: true,
        icon: MarketplaceIcon,
        Component: Marketplaces
      },
      {
        label: 'Apps',
        path: PATH.STORAGE.MARKETPLACE_APPS.LIST,
        sidebar: true,
        icon: MarketplaceAppIcon,
        Component: MarketplaceApps
      }
    ]
  },
  {
    label: 'Networks',
    sidebar: true,
    icon: NetworksIcon,
    routes: [
      {
        label: 'Virtual Networks',
        path: PATH.NETWORK.VNETS.LIST,
        sidebar: true,
        icon: NetworkIcon,
        Component: VirtualNetworks
      },
      {
        label: 'Network Templates',
        path: PATH.NETWORK.VN_TEMPLATES.LIST,
        sidebar: true,
        icon: NetworkTemplateIcon,
        Component: VNetworkTemplates
      }
    ]
  },
  {
    label: 'Infrastructure',
    sidebar: true,
    icon: InfrastructureIcon,
    routes: [
      {
        label: 'Clusters',
        path: PATH.INFRASTRUCTURE.CLUSTERS.LIST,
        sidebar: true,
        icon: ClusterIcon,
        Component: Clusters
      },
      {
        label: 'Hosts',
        path: PATH.INFRASTRUCTURE.HOSTS.LIST,
        sidebar: true,
        icon: HostIcon,
        Component: Hosts
      },
      {
        label: 'Zones',
        path: PATH.INFRASTRUCTURE.ZONES.LIST,
        sidebar: true,
        icon: ZoneIcon,
        Component: Zones
      }
    ]
  },
  {
    label: 'System',
    sidebar: true,
    icon: SystemIcon,
    routes: [
      {
        label: 'Users',
        path: PATH.SYSTEM.USERS.LIST,
        sidebar: true,
        icon: UserIcon,
        Component: Users
      },
      {
        label: 'Groups',
        path: PATH.SYSTEM.GROUPS.LIST,
        sidebar: true,
        icon: GroupIcon,
        Component: Groups
      }
    ]
  },
  {
    label: 'Settings',
    path: PATH.SETTINGS,
    sidebar: true,
    icon: SettingsIcon,
    Component: Settings
  }
]

export default { PATH, ENDPOINTS }
