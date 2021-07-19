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
  All: 'All',

  /* actions */
  Accept: 'Accept',
  BackToList: 'Back to %s list',
  Cancel: 'Cancel',
  Clone: 'Clone',
  Configuration: 'Configuration',
  Delete: 'Delete',
  Deploy: 'Deploy',
  Edit: 'Edit',
  Finish: 'Finish',
  Info: 'Info',
  Remove: 'Remove',
  Save: 'Save',
  Search: 'Search',
  Select: 'Select',
  SelectGroup: 'Select a group',
  SelectRequest: 'Select request',
  Show: 'Show',
  ShowAll: 'Show all',
  SignIn: 'Sign In',
  SignOut: 'Sign Out',
  Submit: 'Submit',
  Resize: 'Resize',
  ResizeCapacity: 'Resize capacity',
  AttachDisk: 'Attach disk',
  AttachNic: 'Attach nic',
  Detach: 'Detach',

  /* questions */
  DoYouWantProceed: 'Do you want proceed?',

  /* dashboard */
  InTotal: 'In Total',
  Used: 'Used',

  /* login */
  Username: 'Username',
  Password: 'Password',
  Token2FA: '2FA Token',
  KeepLoggedIn: 'Keep me logged in',
  Credentials: 'Credentials',

  /* errors */
  SessionExpired: 'Sorry, your session has expired',
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
  VMGroup: 'VMGroup',
  VMGroups: 'VMGroups',

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

  /* instances schema */
  IP: 'IP',
  Reschedule: 'Reschedule',
  DeployID: 'Deploy ID',
  Monitoring: 'Monitoring',

  /* flow schema */
  Strategy: 'Strategy',
  ShutdownAction: 'Shutdown action',
  ReadyStatusGate: 'Ready status gate',

  /* VM schema */
  /* VM schema - capacity */
  PhysicalCpu: 'Physical CPU',
  VirtualCpu: 'Virtual CPU',
  VirtualCores: 'Virtual Cores',
  Cores: 'Cores',
  Sockets: 'Sockets',
  Memory: 'Memory',
  CostCpu: 'Cost / CPU',
  CostMByte: 'Cost / MByte',
  /* VM schema - network */
  NIC: 'NIC',
  Alias: 'Alias',

  /* security group schema */
  TCP: 'TCP',
  UDP: 'UDP',
  ICMP: 'ICMP',
  ICMPV6: 'ICMPv6',
  IPSEC: 'IPsec',
  Outbound: 'Outbound',
  Inbound: 'Inbound'
}
