/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import {
  RefreshDouble as BackupIcon,
  Server as ClusterIcon,
  Db as DatastoreIcon,
  Archive as FileIcon,
  Folder as VmGroupIcon,
  Group as GroupIcon,
  HardDrive as HostIcon,
  BoxIso as ImageIcon,
  CloudSync as InfrastructureIcon,
  Cell2X2 as InstancesIcons,
  CloudDownload as MarketplaceAppIcon,
  SimpleCart as MarketplaceIcon,
  NetworkAlt as NetworkIcon,
  KeyframesCouple as NetworkTemplateIcon,
  ServerConnection as NetworksIcon,
  HistoricShield as SecurityGroupIcon,
  MultiplePagesEmpty as ServiceTemplateIcon,
  Packages as ServicesIcon,
  Box as StorageIcon,
  Home as SystemIcon,
  EmptyPage as TemplateIcon,
  Archive as TemplatesIcon,
  User as UserIcon,
  List as VDCIcon,
  Shuffle as VRoutersIcons,
  ModernTv as VmsIcons,
  MinusPinAlt as ZoneIcon,
} from 'iconoir-react'

import loadable from '@loadable/component'
import { RESOURCE_NAMES, T } from 'client/constants'

const VirtualMachines = loadable(
  () => import('client/containers/VirtualMachines'),
  { ssr: false }
)
const VirtualMachineDetail = loadable(
  () => import('client/containers/VirtualMachines/Detail'),
  { ssr: false }
)
const VirtualRouters = loadable(
  () => import('client/containers/VirtualRouters'),
  { ssr: false }
)

const Services = loadable(() => import('client/containers/Services'), {
  ssr: false,
})
const ServiceDetail = loadable(
  () => import('client/containers/Services/Detail'),
  { ssr: false }
)

const VmTemplates = loadable(() => import('client/containers/VmTemplates'), {
  ssr: false,
})

const InstantiateVmTemplate = loadable(
  () => import('client/containers/VmTemplates/Instantiate'),
  { ssr: false }
)
const CreateVmTemplate = loadable(
  () => import('client/containers/VmTemplates/Create'),
  { ssr: false }
)
const VMTemplateDetail = loadable(
  () => import('client/containers/VmTemplates/Detail'),
  { ssr: false }
)
// const VrTemplates = loadable(() => import('client/containers/VrTemplates'), { ssr: false })
const VmGroups = loadable(() => import('client/containers/VmGroups'), {
  ssr: false,
})

const CreateVmGroup = loadable(
  () => import('client/containers/VmGroups/Create'),
  { ssr: false }
)

// const VmGroupDetail = loadable(
//   () => import('client/containers/VmGroups/Detail'),
//   { ssr: false }
// )

const ServiceTemplates = loadable(
  () => import('client/containers/ServiceTemplates'),
  { ssr: false }
)
// const DeployServiceTemplates = loadable(() => import('client/containers/ServiceTemplates/Instantiate'), { ssr: false })
// const CreateServiceTemplates = loadable(() => import('client/containers/ServiceTemplates/Create'), { ssr: false })
const ServiceTemplateDetail = loadable(
  () => import('client/containers/ServiceTemplates/Detail'),
  { ssr: false }
)

const Datastores = loadable(() => import('client/containers/Datastores'), {
  ssr: false,
})
const CreateDatastores = loadable(
  () => import('client/containers/Datastores/Create'),
  {
    ssr: false,
  }
)
const DatastoreDetail = loadable(
  () => import('client/containers/Datastores/Detail'),
  { ssr: false }
)

const Images = loadable(() => import('client/containers/Images'), {
  ssr: false,
})
const Files = loadable(() => import('client/containers/Files'), {
  ssr: false,
})
const CreateFiles = loadable(() => import('client/containers/Files/Create'), {
  ssr: false,
})
const SecurityGroups = loadable(
  () => import('client/containers/SecurityGroups'),
  {
    ssr: false,
  }
)
const CreateSecurityGroups = loadable(
  () => import('client/containers/SecurityGroups/Create'),
  {
    ssr: false,
  }
)
const Backups = loadable(() => import('client/containers/Backups'), {
  ssr: false,
})
const BackupDetail = loadable(
  () => import('client/containers/Backups/Detail'),
  {
    ssr: false,
  }
)
const CreateImages = loadable(() => import('client/containers/Images/Create'), {
  ssr: false,
})
const CreateDockerfile = loadable(
  () => import('client/containers/Images/Dockerfile'),
  {
    ssr: false,
  }
)
const Marketplaces = loadable(() => import('client/containers/Marketplaces'), {
  ssr: false,
})
const MarketplaceApps = loadable(
  () => import('client/containers/MarketplaceApps'),
  { ssr: false }
)
const CreateMarketplaceApp = loadable(
  () => import('client/containers/MarketplaceApps/Create'),
  { ssr: false }
)

const VirtualNetworks = loadable(
  () => import('client/containers/VirtualNetworks'),
  { ssr: false }
)
const VirtualNetworksDetail = loadable(
  () => import('client/containers/VirtualNetworks/Detail'),
  { ssr: false }
)
const CreateVirtualNetwork = loadable(
  () => import('client/containers/VirtualNetworks/Create'),
  { ssr: false }
)
const VNetworkTemplates = loadable(
  () => import('client/containers/VNetworkTemplates'),
  { ssr: false }
)
// const NetworkTopologies = loadable(() => import('client/containers/NetworkTopologies'), { ssr: false })

const Clusters = loadable(() => import('client/containers/Clusters'), {
  ssr: false,
})
const ClusterDetail = loadable(
  () => import('client/containers/Clusters/Detail'),
  { ssr: false }
)
const Hosts = loadable(() => import('client/containers/Hosts'), { ssr: false })
const HostDetail = loadable(() => import('client/containers/Hosts/Detail'), {
  ssr: false,
})
const CreateHost = loadable(() => import('client/containers/Hosts/Create'), {
  ssr: false,
})
const Zones = loadable(() => import('client/containers/Zones'), { ssr: false })

const Users = loadable(() => import('client/containers/Users'), { ssr: false })
const UserDetail = loadable(() => import('client/containers/Users/Detail'), {
  ssr: false,
})
const CreateUser = loadable(() => import('client/containers/Users/Create'), {
  ssr: false,
})

const Groups = loadable(() => import('client/containers/Groups'), {
  ssr: false,
})
const GroupDetail = loadable(() => import('client/containers/Groups/Detail'), {
  ssr: false,
})

const VDCs = loadable(() => import('client/containers/VDCs'), { ssr: false })

const VDCDetail = loadable(() => import('client/containers/VDCs/Detail'), {
  ssr: false,
})

const VDCCreate = loadable(() => import('client/containers/VDCs/Create'), {
  ssr: false,
})

// const ACLs = loadable(() => import('client/containers/ACLs'), { ssr: false })

export const PATH = {
  INSTANCE: {
    VMS: {
      LIST: `/${RESOURCE_NAMES.VM}`,
      DETAIL: `/${RESOURCE_NAMES.VM}/:id`,
    },
    VROUTERS: {
      LIST: `/${RESOURCE_NAMES.VROUTER}`,
    },
    SERVICES: {
      LIST: `/${RESOURCE_NAMES.SERVICE}`,
      DETAIL: `/${RESOURCE_NAMES.SERVICE}/:id`,
    },
  },
  TEMPLATE: {
    VMS: {
      LIST: `/${RESOURCE_NAMES.VM_TEMPLATE}`,
      INSTANTIATE: `/${RESOURCE_NAMES.VM_TEMPLATE}/instantiate`,
      CREATE: `/${RESOURCE_NAMES.VM_TEMPLATE}/create`,
      DETAIL: `/${RESOURCE_NAMES.VM_TEMPLATE}/:id`,
    },
    VMGROUP: {
      LIST: `/${RESOURCE_NAMES.VM_GROUP}`,
      INSTANTIATE: `/${RESOURCE_NAMES.VM_GROUP}/instantiate`,
      CREATE: `/${RESOURCE_NAMES.VM_GROUP}/create`,
      DETAIL: `/${RESOURCE_NAMES.VM_GROUP}/:id`,
    },
    SERVICES: {
      LIST: `/${RESOURCE_NAMES.SERVICE_TEMPLATE}`,
      DETAIL: `/${RESOURCE_NAMES.SERVICE_TEMPLATE}/:id`,
      DEPLOY: `/${RESOURCE_NAMES.SERVICE_TEMPLATE}/deploy/`,
      CREATE: `/${RESOURCE_NAMES.SERVICE_TEMPLATE}/create`,
    },
  },
  STORAGE: {
    DATASTORES: {
      LIST: `/${RESOURCE_NAMES.DATASTORE}`,
      DETAIL: `/${RESOURCE_NAMES.DATASTORE}/:id`,
      CREATE: `/${RESOURCE_NAMES.DATASTORE}/create`,
    },
    IMAGES: {
      LIST: `/${RESOURCE_NAMES.IMAGE}`,
      DETAIL: `/${RESOURCE_NAMES.IMAGE}/:id`,
      CREATE: `/${RESOURCE_NAMES.IMAGE}/create`,
      DOCKERFILE: `/${RESOURCE_NAMES.IMAGE}/dockerfile`,
    },
    FILES: {
      LIST: `/${RESOURCE_NAMES.FILE}`,
      DETAIL: `/${RESOURCE_NAMES.FILE}/:id`,
      CREATE: `/${RESOURCE_NAMES.FILE}/create`,
    },
    BACKUPS: {
      LIST: `/${RESOURCE_NAMES.BACKUP}`,
      DETAIL: `/${RESOURCE_NAMES.BACKUP}/:id`,
    },
    MARKETPLACES: {
      LIST: `/${RESOURCE_NAMES.MARKETPLACE}`,
      DETAIL: `/${RESOURCE_NAMES.MARKETPLACE}/:id`,
    },
    MARKETPLACE_APPS: {
      LIST: `/${RESOURCE_NAMES.APP}`,
      DETAIL: `/${RESOURCE_NAMES.APP}/:id`,
      CREATE: `/${RESOURCE_NAMES.APP}/create`,
    },
  },
  NETWORK: {
    VNETS: {
      LIST: `/${RESOURCE_NAMES.VNET}`,
      DETAIL: `/${RESOURCE_NAMES.VNET}/:id`,
      CREATE: `/${RESOURCE_NAMES.VNET}/create`,
    },
    VN_TEMPLATES: {
      LIST: `/${RESOURCE_NAMES.VN_TEMPLATE}`,
      DETAIL: `/${RESOURCE_NAMES.VN_TEMPLATE}/:id`,
    },
    SEC_GROUPS: {
      LIST: `/${RESOURCE_NAMES.SEC_GROUP}`,
      DETAIL: `/${RESOURCE_NAMES.SEC_GROUP}/:id`,
      CREATE: `/${RESOURCE_NAMES.SEC_GROUP}/create`,
    },
  },
  INFRASTRUCTURE: {
    CLUSTERS: {
      LIST: `/${RESOURCE_NAMES.CLUSTER}`,
      DETAIL: `/${RESOURCE_NAMES.CLUSTER}/:id`,
    },
    HOSTS: {
      LIST: `/${RESOURCE_NAMES.HOST}`,
      DETAIL: `/${RESOURCE_NAMES.HOST}/:id`,
      CREATE: `/${RESOURCE_NAMES.HOST}/create`,
    },
    ZONES: {
      LIST: `/${RESOURCE_NAMES.ZONE}`,
      DETAIL: `/${RESOURCE_NAMES.ZONE}/:id`,
    },
  },
  SYSTEM: {
    USERS: {
      LIST: `/${RESOURCE_NAMES.USER}`,
      DETAIL: `/${RESOURCE_NAMES.USER}/:id`,
      CREATE: `/${RESOURCE_NAMES.USER}/create`,
    },
    GROUPS: {
      LIST: `/${RESOURCE_NAMES.GROUP}`,
      DETAIL: `/${RESOURCE_NAMES.GROUP}/:id`,
    },
    VDCS: {
      LIST: `/${RESOURCE_NAMES.VDC}`,
      DETAIL: `/${RESOURCE_NAMES.VDC}/:id`,
      CREATE: `/${RESOURCE_NAMES.VDC}/create`,
    },
  },
}

const ENDPOINTS = [
  {
    title: T.Instances,
    icon: InstancesIcons,
    routes: [
      {
        title: T.VMs,
        path: PATH.INSTANCE.VMS.LIST,
        sidebar: true,
        icon: VmsIcons,
        Component: VirtualMachines,
      },
      {
        title: T.VM,
        description: (params) => `#${params?.id}`,
        path: PATH.INSTANCE.VMS.DETAIL,
        Component: VirtualMachineDetail,
      },
      {
        title: T.VirtualRouters,
        path: PATH.INSTANCE.VROUTERS.LIST,
        sidebar: true,
        icon: VRoutersIcons,
        Component: VirtualRouters,
      },
      {
        title: T.Services,
        path: PATH.INSTANCE.SERVICES.LIST,
        sidebar: true,
        icon: ServicesIcon,
        Component: Services,
      },
      {
        title: T.Service,
        description: (params) => `#${params?.id}`,
        path: PATH.INSTANCE.SERVICES.DETAIL,
        Component: ServiceDetail,
      },
    ],
  },
  {
    title: T.Templates,
    icon: TemplatesIcon,
    routes: [
      {
        title: T.VMTemplates,
        path: PATH.TEMPLATE.VMS.LIST,
        sidebar: true,
        icon: TemplateIcon,
        Component: VmTemplates,
      },
      {
        title: T.InstantiateVmTemplate,
        description: (_, state) =>
          state?.ID !== undefined && `#${state.ID} ${state.NAME}`,
        path: PATH.TEMPLATE.VMS.INSTANTIATE,
        Component: InstantiateVmTemplate,
      },
      {
        title: (_, state) =>
          state?.ID !== undefined ? T.UpdateVmTemplate : T.CreateVmTemplate,
        description: (_, state) =>
          state?.ID !== undefined && `#${state.ID} ${state.NAME}`,
        path: PATH.TEMPLATE.VMS.CREATE,
        Component: CreateVmTemplate,
      },
      {
        title: T.VMTemplate,
        description: (params) => `#${params?.id}`,
        path: PATH.TEMPLATE.VMS.DETAIL,
        Component: VMTemplateDetail,
      },
      {
        title: T.ServiceTemplates,
        path: PATH.TEMPLATE.SERVICES.LIST,
        sidebar: true,
        icon: ServiceTemplateIcon,
        Component: ServiceTemplates,
      },
      /* {
        title: T.DeployServiceTemplate,
        description: (_, state) =>
          state?.ID !== undefined && `#${state.ID} ${state.NAME}`,
        path: PATH.TEMPLATE.SERVICES.DEPLOY,
        Component: DeployServiceTemplates,
      },
      {
        title: (_, state) =>
          state?.ID !== undefined
            ? T.UpdateServiceTemplate
            : T.CreateServiceTemplate,
        description: (_, state) =>
          state?.ID !== undefined && `#${state.ID} ${state.NAME}`,
        path: PATH.TEMPLATE.SERVICES.CREATE,
        Component: CreateServiceTemplates,
      }, */
      {
        title: T.ServiceTemplate,
        description: (params) => `#${params?.id}`,
        path: PATH.TEMPLATE.SERVICES.DETAIL,
        Component: ServiceTemplateDetail,
      },
      {
        title: (_, state) =>
          state?.ID !== undefined ? T.UpdateVmGroup : T.CreateVmGroup,
        description: (_, state) =>
          state?.ID !== undefined && `#${state.ID} ${state.NAME}`,
        path: PATH.TEMPLATE.VMGROUP.CREATE,
        Component: CreateVmGroup,
      },
      {
        title: T.VMGroups,
        path: PATH.TEMPLATE.VMGROUP.LIST,
        description: (params) => `#${params?.id}`,
        icon: VmGroupIcon,
        sidebar: true,
        Component: VmGroups,
      },
      // {
      //   title: T.VMGroup,
      //   description: (params) => `#${params?.id}`,
      //   path: PATH.TEMPLATE.VMGROUP.DETAIL,
      //   Component: VmGroupDetail,
      // },
    ],
  },
  {
    title: T.Storage,
    icon: StorageIcon,
    routes: [
      {
        title: T.Datastores,
        path: PATH.STORAGE.DATASTORES.LIST,
        sidebar: true,
        icon: DatastoreIcon,
        Component: Datastores,
      },
      {
        title: T.CreateDatastore,
        path: PATH.STORAGE.DATASTORES.CREATE,
        Component: CreateDatastores,
      },
      {
        title: T.Datastore,
        description: (params) => `#${params?.id}`,
        path: PATH.STORAGE.DATASTORES.DETAIL,
        Component: DatastoreDetail,
      },
      {
        title: T.Images,
        path: PATH.STORAGE.IMAGES.LIST,
        sidebar: true,
        icon: ImageIcon,
        Component: Images,
      },
      {
        title: T.CreateImage,
        path: PATH.STORAGE.IMAGES.CREATE,
        Component: CreateImages,
      },
      {
        title: T.Files,
        path: PATH.STORAGE.FILES.LIST,
        sidebar: true,
        icon: FileIcon,
        Component: Files,
      },
      {
        title: T.CreateFile,
        path: PATH.STORAGE.FILES.CREATE,
        Component: CreateFiles,
      },
      {
        title: T.CreateDockerfile,
        path: PATH.STORAGE.IMAGES.DOCKERFILE,
        Component: CreateDockerfile,
      },
      {
        title: T.Backups,
        path: PATH.STORAGE.BACKUPS.LIST,
        sidebar: true,
        icon: BackupIcon,
        Component: Backups,
      },
      {
        title: T.Backup,
        description: (params) => `#${params?.id}`,
        path: PATH.STORAGE.BACKUPS.DETAIL,
        Component: BackupDetail,
      },
      {
        title: T.Marketplaces,
        path: PATH.STORAGE.MARKETPLACES.LIST,
        sidebar: true,
        icon: MarketplaceIcon,
        Component: Marketplaces,
      },
      {
        title: T.Apps,
        path: PATH.STORAGE.MARKETPLACE_APPS.LIST,
        sidebar: true,
        icon: MarketplaceAppIcon,
        Component: MarketplaceApps,
      },
      {
        title: T.CreateMarketApp,
        path: PATH.STORAGE.MARKETPLACE_APPS.CREATE,
        Component: CreateMarketplaceApp,
      },
    ],
  },
  {
    title: T.Networks,
    icon: NetworksIcon,
    routes: [
      {
        title: T.VirtualNetworks,
        path: PATH.NETWORK.VNETS.LIST,
        sidebar: true,
        icon: NetworkIcon,
        Component: VirtualNetworks,
      },
      {
        title: (_, state) =>
          state?.ID !== undefined
            ? T.UpdateVirtualNetwork
            : T.CreateVirtualNetwork,
        description: (_, state) =>
          state?.ID !== undefined && `#${state.ID} ${state.NAME}`,
        path: PATH.NETWORK.VNETS.CREATE,
        Component: CreateVirtualNetwork,
      },
      {
        title: T.VirtualNetworks,
        description: (params) => `#${params?.id}`,
        path: PATH.NETWORK.VNETS.DETAIL,
        Component: VirtualNetworksDetail,
      },
      {
        title: T.NetworkTemplates,
        path: PATH.NETWORK.VN_TEMPLATES.LIST,
        sidebar: true,
        icon: NetworkTemplateIcon,
        Component: VNetworkTemplates,
      },
      {
        title: T.SecurityGroups,
        path: PATH.NETWORK.SEC_GROUPS.LIST,
        sidebar: true,
        icon: SecurityGroupIcon,
        Component: SecurityGroups,
      },
      {
        title: T.CreateSecurityGroup,
        path: PATH.NETWORK.SEC_GROUPS.CREATE,
        Component: CreateSecurityGroups,
      },
    ],
  },
  {
    title: T.Infrastructure,
    icon: InfrastructureIcon,
    routes: [
      {
        title: T.Clusters,
        path: PATH.INFRASTRUCTURE.CLUSTERS.LIST,
        sidebar: true,
        icon: ClusterIcon,
        Component: Clusters,
      },
      {
        title: T.Cluster,
        description: (params) => `#${params?.id}`,
        path: PATH.INFRASTRUCTURE.CLUSTERS.DETAIL,
        Component: ClusterDetail,
      },
      {
        title: T.Hosts,
        path: PATH.INFRASTRUCTURE.HOSTS.LIST,
        sidebar: true,
        icon: HostIcon,
        Component: Hosts,
      },
      {
        title: T.CreateHost,
        path: PATH.INFRASTRUCTURE.HOSTS.CREATE,
        Component: CreateHost,
      },
      {
        title: T.Host,
        description: (params) => `#${params?.id}`,
        path: PATH.INFRASTRUCTURE.HOSTS.DETAIL,
        Component: HostDetail,
      },
      {
        title: T.Zones,
        path: PATH.INFRASTRUCTURE.ZONES.LIST,
        sidebar: true,
        icon: ZoneIcon,
        Component: Zones,
      },
    ],
  },
  {
    title: T.System,
    icon: SystemIcon,
    routes: [
      {
        title: T.CreateUser,
        path: PATH.SYSTEM.USERS.CREATE,
        Component: CreateUser,
      },
      {
        title: T.Users,
        path: PATH.SYSTEM.USERS.LIST,
        sidebar: true,
        icon: UserIcon,
        Component: Users,
      },
      {
        title: T.User,
        description: (params) => `#${params?.id}`,
        path: PATH.SYSTEM.USERS.DETAIL,
        Component: UserDetail,
      },
      {
        title: T.Groups,
        path: PATH.SYSTEM.GROUPS.LIST,
        sidebar: true,
        icon: GroupIcon,
        Component: Groups,
      },
      {
        title: T.Group,
        description: (params) => `#${params?.id}`,
        path: PATH.SYSTEM.GROUPS.DETAIL,
        Component: GroupDetail,
      },
      {
        title: (_, state) =>
          state?.ID !== undefined ? T.UpdateVDC : T.CreateVDC,
        path: PATH.SYSTEM.VDCS.CREATE,
        Component: VDCCreate,
      },
      {
        title: T.VDCs,
        path: PATH.SYSTEM.VDCS.LIST,
        sidebar: true,
        icon: VDCIcon,
        Component: VDCs,
      },
      {
        title: T.VDC,
        description: (params) => `#${params?.id}`,
        path: PATH.SYSTEM.VDCS.DETAIL,
        Component: VDCDetail,
      },
      // {
      //   title: T.Group,
      //   description: (params) => `#${params?.id}`,
      //   path: PATH.SYSTEM.GROUPS.DETAIL,
      //   Component: GroupDetail,
      // },
    ],
  },
]

export { ENDPOINTS }

export default { PATH, ENDPOINTS }
