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
  /* VM Template schema - booting */
  OSBooting: 'OS Booting',
  BootOrder: 'Boot order',

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
  Numa: 'Numa',
  /* Host schema - capacity */
  AllocatedMemory: 'Allocated Memory',
  AllocatedCpu: 'Allocated CPU',
  RealMemory: 'Real Memory',
  RealCpu: 'Real CPU',
  Overcommitment: 'Overcommitment',

  /* Cluster schema */
  /* Cluster schema - capacity */
  ReservedMemory: 'Allocated Memory',
  ReservedCpu: 'Allocated CPU'
}
