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
module.exports = {
  /* pagination / stepper */
  Back: 'Back',
  Previous: 'Previous',
  Next: 'Next',
  SortBy: 'Sort by',
  Filter: 'Filter',
  Filters: 'Filters',
  All: 'All',
  On: 'On',
  ToggleAllCurrentPageRowsSelected: 'Toggle all current page rows selected',
  NumberOfResourcesSelected: 'All %s resources are selected',
  SelectAllResources: 'Select all %s resources',
  ClearSelection: 'Clear selection',

  /* actions */
  Accept: 'Accept',
  Active: 'Active',
  AddAction: 'Add action',
  Attach: 'Attach',
  AttachDisk: 'Attach disk',
  AttachImage: 'Attach image disk',
  AttachNic: 'Attach NIC',
  AttachVolatile: 'Attach volatile disk',
  BackToList: 'Back to %s list',
  Cancel: 'Cancel',
  Change: 'Change',
  ChangeGroup: 'Change group',
  CurrentGroup: 'Current group: %s',
  ChangeOwner: 'Change owner',
  CurrentOwner: 'Current owner: %s',
  Clear: 'Clear',
  Clone: 'Clone',
  CloneSeveralTemplates: 'Clone several Templates',
  CloneTemplate: 'Clone Template',
  Close: 'Close',
  Collapse: 'Collapse',
  Configuration: 'Configuration',
  Create: 'Create',
  CreateMarketApp: 'Create Marketplace App',
  Delete: 'Delete',
  DeleteScheduledAction: 'Delete scheduled action: %s',
  DeleteSomething: 'Delete: %s',
  Deploy: 'Deploy',
  Detach: 'Detach',
  DetachSomething: 'Detach: %s',
  Done: 'Done',
  Edit: 'Edit',
  EditSomething: 'Edit: %s',
  Finish: 'Finish',
  Hold: 'Hold',
  Import: 'Import',
  Info: 'Info',
  Instantiate: 'Instantiate',
  Lock: 'Lock',
  Migrate: 'Migrate',
  MigrateLive: 'Migrate live',
  Pin: 'Pin',
  Poweroff: 'Poweroff',
  PoweroffHard: 'Poweroff hard',
  Reboot: 'Reboot',
  RebootHard: 'Reboot hard',
  Recover: 'Recover',
  RecoverSomething: 'Recover: %s',
  RecoverSeveralVMs: 'Recover several VMs',
  Refresh: 'Refresh',
  Release: 'Release',
  Remove: 'Remove',
  Rename: 'Rename',
  RenameSomething: 'Rename: %s',
  Reschedule: 'Reschedule',
  Resize: 'Resize',
  ResizeCapacity: 'Resize capacity',
  ResizeSomething: 'Resize: %s',
  Resume: 'Resume',
  Revert: 'Revert',
  RevertSomething: 'Revert: %s',
  Save: 'Save',
  SaveAs: 'Save as',
  SaveAsImage: 'Save as Image',
  SaveAsTemplate: 'Save as Template',
  Search: 'Search',
  Select: 'Select',
  SelectHost: 'Select a host',
  SelectGroup: 'Select a group',
  SelectRequest: 'Select request',
  SelectVmTemplate: 'Select a VM Template',
  Share: 'Share',
  Show: 'Show',
  ShowAll: 'Show all',
  SignIn: 'Sign In',
  SignOut: 'Sign Out',
  Stop: 'Stop',
  Submit: 'Submit',
  Suspend: 'Suspend',
  Take: 'Take',
  TakeSnapshot: 'Take snapshot',
  TakeSnapshotOf: 'Take snapshot: %s',
  TakeSnapshotSomething: 'Take snapshot: %s',
  Terminate: 'Terminate',
  TerminateHard: 'Terminate hard',
  Undeploy: 'Undeploy',
  UndeployHard: 'Undeploy hard',
  Unlock: 'Unlock',
  UnReschedule: 'Un-Reschedule',
  Unshare: 'Unshare',
  Update: 'Update',
  UpdateScheduledAction: 'Update scheduled action: %s',

  /* questions */
  Yes: 'Yes',
  No: 'No',
  DoYouWantProceed: 'Do you want proceed?',

  /* Scheduling */
  ScheduledAction: 'Scheduled action',
  Charter: 'Charter',
  Mon: 'Mon',
  Monday: 'Monday',
  Tue: 'Tue',
  Tuesday: 'Tuesday',
  Wed: 'Wed',
  Wednesday: 'Wednesday',
  Thu: 'Thu',
  Thursday: 'Thursday',
  Fri: 'Fri',
  Friday: 'Friday',
  Sat: 'Sat',
  Saturday: 'Saturday',
  Sun: 'Sun',
  Sunday: 'Sunday',
  Weekly: 'Weekly',
  Monthly: 'Monthly',
  Yearly: 'Yearly',
  EachHours: 'Each %s hours',
  AfterTimes: 'After %s times',

  /* dashboard */
  InTotal: 'In Total',
  Used: 'Used',

  /* login */
  Username: 'Username',
  Password: 'Password',
  Token2FA: '2FA Token',
  KeepLoggedIn: 'Keep me logged in',
  Credentials: 'Credentials',
  SwitchView: 'Switch view',
  SwitchGroup: 'Switch group',

  /* errors */
  SessionExpired: 'Sorry, your session has expired',
  SomethingWrong: 'Something go wrong',
  CannotConnectOneFlow: 'Cannot connect to OneFlow server',
  CannotConnectOneProvision: 'Cannot connect to OneProvision server',
  ErrorOneProvisionGUI: 'FireEdge is not correctly configured to operate the OneProvision GUI',
  ContactYourAdmin: 'Please contact your system administrator',
  NotFound: 'Not found',
  Timeout: 'Timeout',
  None: 'None',
  Empty: 'Empty',
  NoDataAvailable: 'There is no data available',

  /* steps form */
  AdvancedOptions: 'Advanced options',
  /* steps form - flow */
  ApplicationOverview: 'Application overview',
  WhereWillItRun: 'Where will it run?',
  ConfigureNetworking: 'Configure networking',
  TierDefinition: 'Tier definition',
  ConfigureTiers: 'Configure Tiers',
  ConfigurePolicies: 'Configure policies',
  ConfigureTemplate: 'Configure template',

  /* steps form - provision */
  ProviderOverview: 'Provider overview',
  ProvisionOverview: 'Provision overview',
  ConfigureConnection: 'Configure connection',
  Location: 'Location',
  ProviderTemplate: 'Provider template',
  ProvisionTemplate: 'Provision template',
  ConfigureInputs: 'Configure inputs',

  /* sections */
  Dashboard: 'Dashboard',

  /* sections - settings */
  Settings: 'Settings',
  Schema: 'Schema',
  Dark: 'Dark',
  Light: 'Light',
  System: 'System',
  Language: 'Language',
  DisableDashboardAnimations: 'Disable dashboard animations',

  /* sections - system */
  User: 'User',
  Users: 'Users',
  Group: 'Group',
  Groups: 'Groups',
  VDC: 'VDC',
  VDCs: 'VDCs',
  ACL: 'ACL',
  ACLs: 'ACLs',

  /* sections - infrastructure */
  Zone: 'Zone',
  Zones: 'Zones',
  Cluster: 'Cluster',
  Clusters: 'Clusters',
  Host: 'Host',
  Hosts: 'Hosts',

  /* sections - network */
  Network: 'Network',
  Networks: 'Networks',
  VirtualNetwork: 'Virtual network',
  VirtualNetworks: 'Virtual networks',
  NetworkTopology: 'Network topology',
  NetworksTopologies: 'Networks topologies',
  SecurityGroup: 'Security group',
  SecurityGroups: 'Security groups',

  /* sections - storage */
  Datastore: 'Datastore',
  Datastores: 'Datastores',
  Image: 'Image',
  Images: 'Images',
  File: 'File',
  Files: 'Files',
  Marketplace: 'Marketplace',
  Marketplaces: 'Marketplaces',
  App: 'App',
  Apps: 'Apps',

  /* sections - templates & instances */
  VM: 'VM',
  VMs: 'VMs',
  VirtualRouter: 'VirtualRouter',
  VirtualRouters: 'VirtualRouters',
  VMGroup: 'VM Group',
  VMGroups: 'VM Groups',
  VMTemplate: 'VM Template',
  VMTemplates: 'VM Templates',

  /* sections - flow */
  ApplicationsTemplates: 'Applications templates',
  ApplicationsInstances: 'Applications instances',
  Tier: 'Tier',
  Tiers: 'Tiers',

  /* sections - provision */
  Provider: 'Provider',
  Providers: 'Providers',
  Provision: 'Provision',
  Provisions: 'Provisions',

  /* tabs */
  General: 'General',
  Information: 'Information',
  Placement: 'Placement',

  /* general schema */
  ID: 'ID',
  Name: 'Name',
  State: 'State',
  Description: 'Description',
  RegistrationTime: 'Registration time',
  StartTime: 'Start time',
  EndTime: 'End time',
  Locked: 'Locked',
  Attributes: 'Attributes',

  /* permissions */
  Permissions: 'Permissions',
  Use: 'Use',
  Manage: 'Manage',
  Admin: 'Admin',

  /* ownership */
  Ownership: 'Ownership',
  Owner: 'Owner',
  Other: 'Other',
  Primary: 'Primary',
  Secondary: 'Secondary',

  /* instances schema */
  IP: 'IP',
  DeployID: 'Deploy ID',
  vCenterDeployment: 'vCenter Deployment',
  Deployment: 'Deployment',
  Monitoring: 'Monitoring',

  /* flow schema */
  Strategy: 'Strategy',
  ShutdownAction: 'Shutdown action',
  ReadyStatusGate: 'Ready status gate',

  /* VM schema */
  /* VM schema - info */
  UserTemplate: 'User Template',
  Template: 'Template',
  WhereIsRunning:
  'VM %1$s is currently running on Host %2$s and Datastore %3$s',
  /* VM schema - capacity */
  Capacity: 'Capacity',
  PhysicalCpu: 'Physical CPU',
  VirtualCpu: 'Virtual CPU',
  VirtualCores: 'Virtual Cores',
  Cores: 'Cores',
  Sockets: 'Sockets',
  Memory: 'Memory',
  CostCpu: 'Cost / CPU',
  CostMByte: 'Cost / MByte',
  /* VM schema - storage */
  Storage: 'Storage',
  Disk: 'Disk',
  Disks: 'Disks',
  Volatile: 'Volatile',
  VolatileDisk: 'Volatile disk',
  Snapshot: 'Snapshot',
  DiskSnapshot: 'Disk snapshot',
  /* VM schema - network */
  NIC: 'NIC',
  Alias: 'Alias',

  /* VM Template schema */
  /* VM schema - general */
  Logo: 'Logo',
  Hypervisor: 'Hypervisor',
  /* VM schema - ownership */
  InstantiateAsUser: 'Instantiate as different User',
  InstantiateAsGroup: 'Instantiate as different Group',
  /* VM Template schema - capacity */
  MaxMemory: 'Max memory',
  MemoryModification: 'Memory modification',
  AllowUsersToModifyMemory:
    "Allow users to modify this template's default memory on instantiate",
  MemoryConcept: 'Amount of RAM required for the VM',
  CpuConcept: `
    Percentage of CPU divided by 100 required for the
    Virtual Machine. Half a processor is written 0.5`,
  MaxVirtualCpu: 'Max Virtual CPU',
  VirtualCpuConcept: `
    Number of virtual cpus. This value is optional, the default
    hypervisor behavior is used, usually one virtual CPU`,
  AllowUsersToModifyCpu:
    "Allow users to modify this template's default CPU on instantiate",
  VirtualCpuModification: 'Virtual CPU modification',
  AllowUsersToModifyVirtualCpu:
    "Allow users to modify this template's default Virtual CPU on instantiate",
  EnableHotResize: 'Enable hot resize',
  /* VM schema - VM Group */
  AssociateToVMGroup: 'Associate VM to a VM Group',
  Role: 'Role',
  /* VM Template schema - vCenter */
  vCenterTemplateRef: 'vCenter Template reference',
  vCenterClusterRef: 'vCenter Cluster reference',
  vCenterInstanceId: 'vCenter instance ID',
  vCenterVmFolder: 'vCenter VM folder',
  vCenterVmFolderConcept: `
  If specified, the the VMs and Template folder path where
  the VM will be created inside the data center.
  The path is delimited by slashes (e.g /Management/VMs).
  If no path is set the VM will be placed in the same folder where
  the template is located.
  `,
  /* VM Template schema - placement */
  HostReqExpression: 'Host requirements expression',
  HostReqExpressionConcept: `
    Boolean expression that rules out provisioning hosts
    from list of machines suitable to run this VM`,
  HostPolicyExpression: 'Host policy expression',
  HostPolicyExpressionConcept: `
    This field sets which attribute will be used
    to sort the suitable hosts for this VM`,
  DatastoreReqExpression: 'Datastore requirements expression',
  DatastoreReqExpressionConcept: `
    Boolean expression that rules out entries from
    the pool of datastores suitable to run this VM`,
  DatastorePolicyExpression: 'Datastore policy expression',
  DatastorePolicyExpressionConcept: `
    This field sets which attribute will be used to
    sort the suitable datastores for this VM`,
  /* VM Template schema - OS & CPU */
  /* VM Template schema - OS & CPU - boot */
  Boot: 'Boot',
  OSAndCpu: 'OS & CPU',
  OSBooting: 'OS Booting',
  BootOrder: 'Boot order',
  BootOrderConcept: 'Select the devices to boot from, and their order',
  CpuArchitecture: 'CPU Architecture',
  BusForSdDisks: 'Bus for SD disks',
  MachineType: 'Machine type',
  RootDevice: 'Root devide',
  KernelBootParameters: 'Kernel boot parameters',
  PathBootloader: 'Path to the bootloader executable',
  UniqueIdOfTheVm: 'Unique ID of the VM',
  UniqueIdOfTheVmConcept: `
    It’s referenced as machine ID inside the VM.
    Could be used to force ID for licensing purposes`,
  Firmware: 'Firmware',
  FirmwareConcept:
  'This attribute allows to define the type of firmware used to boot the VM',
  FirmwareSecure: 'Firmware secure',
  CpuModel: 'CPU Model',
  CustomPath: 'Customize with path',
  /* VM Template schema - OS & CPU - kernel */
  Kernel: 'Kernel',
  KernelExpression: 'Kernel expression',
  KernelPath: 'Path to the OS kernel to boot the image',
  /* VM Template schema - OS & CPU - ramdisk */
  Ramdisk: 'Ramdisk',
  RamdiskExpression: 'Ramdisk expression',
  RamdiskPath: 'Path to the initrd image',
  /* VM Template schema - OS & CPU - features */
  Features: 'Features',
  Acpi: 'ACPI',
  AcpiConcept:
    'Add support in the VM for Advanced Configuration and Power Interface (ACPI)',
  Pae: 'PAE',
  PaeConcept: 'Add support in the VM for Physical Address Extension (PAE)',
  Apic: 'APIC',
  ApicConcept: 'Enables the advanced programmable IRQ management',
  Hyperv: 'Hyper-v',
  HypervConcept: 'Add support in the VM for hyper-v features (HYPERV)',
  Localtime: 'Localtime',
  LocaltimeConcept:
    'The guest clock will be synchronized to the hosts configured timezone when booted',
  GuestAgent: 'QEMU Guest Agent',
  GuestAgentConcept:
    `Enables the QEMU Guest Agent communication.
    This does not start the Guest Agent inside the VM`,
  VirtioQueues: 'Virtio-scsi Queues',
  VirtioQueuesConcept:
    `Number of vCPU queues to use in the virtio-scsi controller.
    Leave blank to use the default value`,
  IoThreads: 'Iothreads',
  IoThreadsConcept:
    `Number of iothreads for virtio disks.
    By default threads will be assign to disk by round robin algorithm.
    Disk thread id can be forced by disk IOTHREAD attribute`,
  /* VM Template schema - context */
  Context: 'Context',
  /* VM Template schema - Input/Output */
  InputOrOutput: 'Input / Output',
  /* VM Template schema - Input/Output - graphics */
  Graphics: 'Graphics',
  VMRC: 'VMRC',
  VNC: 'VNC',
  SDL: 'SDL',
  SPICE: 'SPICE',
  Type: 'Type',
  ListenOnIp: 'Listen on IP',
  ServerPort: 'Server port',
  ServerPortConcept: 'Port for the VNC/SPICE server',
  Keymap: 'Keymap',
  GenerateRandomPassword: 'Generate random password',
  Command: 'Command',
  /* VM Template schema - NUMA */
  PinPolicy: 'Pin Policy',
  PinPolicyConcept: 'Virtual CPU pinning preference: %s',
  NumaSocketsConcept: 'Number of sockets or NUMA nodes',
  NumaCoresConcept: 'Number of cores per node',
  Threads: 'Threads',
  ThreadsConcept: 'Number of threads per core',
  HugepagesSize: 'Hugepages size',
  HugepagesSizeConcept:
    'Size of hugepages (MB). If not defined no hugepages will be used',
  MemoryAccess: 'Memory Access',
  MemoryAccessConcept: 'Control if the memory is to be mapped: %s',
  VirtualCpuSelected: 'Virtual Cpu selected',
  VirtualCpuSelectedConcept: `
    Number of virtual CPUs. This value is optional, the default
    hypervisor behavior is used, usually one virtual CPU`,

  /* security group schema */
  TCP: 'TCP',
  UDP: 'UDP',
  ICMP: 'ICMP',
  ICMPV6: 'ICMPv6',
  IPSEC: 'IPsec',
  Outbound: 'Outbound',
  Inbound: 'Inbound',

  /* Host schema */
  IM_MAD: 'IM MAD',
  VM_MAD: 'VM MAD',
  Wilds: 'Wilds',
  Zombies: 'Zombies',
  Numa: 'NUMA',
  /* Host schema - capacity */
  AllocatedMemory: 'Allocated Memory',
  AllocatedCpu: 'Allocated CPU',
  RealMemory: 'Real Memory',
  RealCpu: 'Real CPU',
  Overcommitment: 'Overcommitment',

  /* Cluster schema */
  /* Cluster schema - capacity */
  ReservedMemory: 'Allocated Memory',
  ReservedCpu: 'Allocated CPU',

  /* User inputs */
  Fixed: 'Fixed',
  Range: 'Range',
  List: 'List',
  AnyValue: 'Any value',

  /* Validation */
  /* Validation - mixed */
  'validation.mixed.default': 'Is invalid',
  'validation.mixed.required': 'Is a required field',
  'validation.mixed.oneOf': 'Must be one of the following values: %s',
  'validation.mixed.notOneOf': 'Must not be one of the following values: %s',
  'validation.mixed.notType': 'Invalid type',
  'validation.mixed.notType.string': 'Must be a string type',
  'validation.mixed.notType.number': 'Must be a number type',
  'validation.mixed.notType.date': 'Must be a date type',
  'validation.mixed.notType.boolean': 'Must be a boolean type',
  'validation.mixed.notType.object': 'Must be an object type',
  'validation.mixed.notType.array': 'Must be an array type',
  'validation.mixed.defined': 'Must be defined',
  /* Validation - string */
  'validation.string.length': 'Must be exactly %s characters',
  'validation.string.min': 'Must be at least %s characters',
  'validation.string.max': 'Must be at most %s characters',
  'validation.string.matches': 'Must match the following: "%s"',
  'validation.string.email': 'Must be a valid email',
  'validation.string.url': 'Must be a valid URL',
  'validation.string.uuid': 'Must be a valid UUID',
  'validation.string.trim': 'Must be a trimmed string',
  'validation.string.lowercase': 'Must be a lowercase string',
  'validation.string.uppercase': 'Must be a upper case string',
  'validation.string.invalidFormat': 'File has invalid format',
  /* Validation - number */
  'validation.number.min': 'Must be greater than or equal to %s',
  'validation.number.max': 'Must be less than or equal to %s',
  'validation.number.lessThan': 'Must be less than %s',
  'validation.number.moreThan': 'Must be greater than %s',
  'validation.number.positive': 'Must be a positive number',
  'validation.number.negative': 'Must be a negative number',
  'validation.number.integer': 'Must be an integer',
  'validation.number.isDivisible': 'Should be divisible by %s',
  /* Validation - date  */
  'validation.date.min': 'Must be later than %s',
  'validation.date.max': 'Must be at earlier than %s',
  /* Validation - boolean  */
  'validation.boolean.isValue': 'Must be %s',
  /* Validation - object  */
  'validation.object.noUnknown': 'Has unspecified keys: %s',
  /* Validation - array  */
  'validation.array.min': 'Must have at least %s items',
  'validation.array.max': 'Must have less than or equal to %s items',
  'validation.array.length': 'Must have %s items'
}
