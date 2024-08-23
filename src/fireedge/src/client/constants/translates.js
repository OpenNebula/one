/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
  Of: 'of',
  DivideWindow: 'Divide Window',
  UnDivideWindow: 'Undivide Window',
  Next: 'Next',
  Sort: 'Sort',
  Asc: 'Asc',
  Desc: 'Desc',
  SortBy: 'Sort by',
  Filter: 'Filter',
  Filters: 'Filters',
  FilterBy: 'Filter by',
  FilterLabels: 'Filter labels',
  FilterByLabel: 'Filter by label',
  First: 'First',
  Last: 'Last',
  ApplyLabels: 'Apply labels',
  Apply: 'Apply',
  Label: 'Label',
  NoLabels: 'No labels',
  All: 'All',
  On: 'On',
  ToggleAllSelectedCardsCurrentPage:
    'Toggle all selected cards in current page',
  NumberOfResourcesSelected: 'All %s resources are selected',
  SelectAllResources: 'Select all %s resources',
  ClearSelection: 'Clear selection',
  ResetFilters: 'Clear current search query, filters, and sorts',
  VmsClearErrors:
    'Clear error messages and warnings from selects Virtual Machines',
  ItemsTables: 'Displays the items as a Table',
  ItemsRow: 'Displays the items as a list',
  RowsPerPage: 'Rows per page',

  /* actions */
  Accept: 'Accept',
  Active: 'Active',
  Add: 'Add',
  AddRole: 'Add role',
  AddAction: 'Add action',
  Append: 'Append',
  Attach: 'Attach',
  AttachDisk: 'Attach disk',
  AttachImage: 'Attach image disk',
  AttachNic: 'Attach NIC',
  AttachVolatile: 'Attach volatile disk',
  BackToList: 'Back to %s list',
  Backup: 'Backup',
  Cancel: 'Cancel',
  Change: 'Change',
  ChangeGroup: 'Change group',
  ChangeOwner: 'Change owner',
  Clear: 'Clear',
  ClickToCopy: 'Click to copy',
  Confirm: 'Confirm',
  Commit: 'Commit',
  Clone: 'Clone',
  CloneSeveralTemplates: 'Clone several Templates',
  CloneTemplate: 'Clone Template',
  CloneSecGroup: 'Clone Security Group',
  CloneSecGroups: 'Clone Security Groups',
  Close: 'Close',
  Collapse: 'Collapse',
  Configuration: 'Configuration',
  CopiedToClipboard: 'Copied to clipboard',
  Create: 'Create',
  CreateDatastore: 'Create Datastore',
  CreateFile: 'Create File',
  CreateHost: 'Create Host',
  CreateImage: 'Create Image',
  CreateMarketplace: 'Create Marketplace',
  CreateMarketApp: 'Create Marketplace App',
  CreateProvider: 'Create Provider',
  CreateProvision: 'Create Provision',
  CreateSecurityGroup: 'Create Security Group',
  CreateServiceTemplate: 'Create Service Template',
  CreateVirtualRouterTemplate: 'Create Virtual Router Template',
  InstantiateServiceTemplate: 'Instantiate Service Template',
  InstantiateVirtualRouterTemplate: 'Instantiate Virtual Router Template',
  InstantiateVirtualRouter: 'Instantiate Virtual Router',
  CreateUser: 'Create User',
  UpdateUser: 'Update User',
  CreateVirtualNetwork: 'Create Virtual Network',
  CreateVirtualNetworkTemplate: 'Create Virtual Network Template',
  CreateVmTemplate: 'Create VM Template',
  CreateVDC: 'Create VDC',
  UpdateVDC: 'Update VDC',
  CreateBackupJob: 'Create BackupJob',
  CurrentGroup: 'Current group: %s',
  CurrentOwner: 'Current owner: %s',
  Delete: 'Delete',
  DeleteAllImages: 'Delete all images',
  DeleteDb: 'Delete database',
  DeleteScheduleAction: 'Delete schedule action: %s',
  DeleteSeveralTemplates: 'Delete several Templates',
  DeleteSeveralVirtualNetworks: 'Delete several Virtual Networks',
  DeleteVirtualRouter: 'Delete Virtual Router',
  DeleteSeveralVirtualRouters: 'Delete several Virtual Routers',
  DeleteSomething: 'Delete: %s',
  DeleteAddressRange: 'Delete Address Range',
  DeleteTemplate: 'Delete Template',
  DeleteVirtualNetwork: 'Delete Virtual Network',
  DeleteOtherSnapshots: 'This will delete all the other image snapshots',
  Deploy: 'Deploy',
  DeployServiceTemplate: 'Deploy Service Template',
  Detach: 'Detach',
  DetachRestricted:
    'You cannot delete this resource because it has restricted attributes on this template. Please, contact with your administrator.',
  DetachSomething: 'Detach: %s',

  Disable: 'Disable',
  Dismiss: 'Dismiss',
  DiskSnapshotCreate: 'Disk snapshot create',
  DiskSnapshotRevert: 'Disk snapshot revert',
  DiskSnapshotDelete: 'Disk snapshot delete',
  Done: 'Done',
  Edit: 'Edit',
  EditSomething: 'Edit: %s',
  Enable: 'Enable',
  Enabled: 'Enabled',
  Failure: 'Failure',
  Finish: 'Finish',
  Flatten: 'Flatten',
  FlattenSnapshot: 'Flatten %s',
  Hold: 'Hold',
  Import: 'Import',
  Info: 'Info',
  Instantiate: 'Instantiate',
  InstantiateVmTemplate: 'Instantiate VM Template',
  InstantiateVnTemplate: 'Instantiate Network Template',
  LocateOnTable: 'Locate on table',
  Lock: 'Lock',
  Migrate: 'Migrate',
  MigrateLive: 'Migrate live',
  Offline: 'Offline',
  PerformAction: 'Perform action',
  AllRoles: 'All roles',
  Pin: 'Pin',
  Poweroff: 'Poweroff',
  PoweroffHard: 'Poweroff hard',
  PressEscapeToCancel: 'Press Escape to cancel',
  Reboot: 'Reboot',
  RebootHard: 'Reboot hard',
  Recover: 'Recover',
  RecoverSeveralVMs: 'Recover several VMs',
  RecoverSeveralServices: 'Recover several services',
  RecoverService: 'Recover service',
  RecoverSomething: 'Recover: %s',
  Recreate: 'Recreate',
  Refresh: 'Refresh',
  Release: 'Release',
  ReleaseIp: 'Release IP',
  Remove: 'Remove',
  Rename: 'Rename',
  RenameSomething: 'Rename: %s',
  Reschedule: 'Reschedule',
  Reserve: 'Reserve',
  Resize: 'Resize',
  ResizeRestricted:
    'You cannot resize the disk because its SIZE attribute is restricted. Please, contact with your administrator.',
  ResizeCapacity: 'Resize capacity',
  ResizeSomething: 'Resize: %s',
  Resume: 'Resume',
  Retry: 'Retry',
  Restore: 'Restore',
  Revert: 'Revert',
  RevertSomething: 'Revert: %s',
  Save: 'Save',
  SaveAs: 'Save as',
  SaveAsImage: 'Save as Image',
  SaveAsTemplate: 'Save as Template',
  Search: 'Search',
  Select: 'Select',
  SelectCluster: 'Select Cluster',
  SelectClusters: 'Select Clusters',
  SelectDatastore: 'Select a Datastore to store the resource',
  SelectDatastoreImage: 'Select a Datastore',
  SelectDatastores: 'Select datastores',
  SelectDisk: 'Select disk',
  SelectDockerHubTag: 'Select DockerHub image tag (default latest)',
  SelectGroup: 'Select a group',
  SelectHost: 'Select host',
  SelectHosts: 'Select hosts',
  SelectMarketplace: 'Select Marketplace',
  SelectNetwork: 'Select a network',
  SelectVirtualNetworks: 'Select virtual networks',
  SelectNewCluster: 'Select a new Cluster',
  SelectRequest: 'Select request',
  SelectTheNewDatastore: 'Select the new datastore',
  SelectTheNewGroup: 'Select the new group',
  SelectTheNewOwner: 'Select the new owner',
  SelectTheNewSecurityGroup: 'Select the new security group',
  SelectVms: 'Select VMs',
  SelectVmTemplate: 'Select a VM Template',
  SelectYourActiveGroup: 'Select your active group',
  Share: 'Share',
  Show: 'Show',
  ShowAll: 'Show all',
  ShowBelongingUser: 'Show all owned by the user',
  ShowBelongingUserAndGroups: 'Show all owned by the user or his groups',
  SignIn: 'Sign In',
  SignOut: 'Sign Out',
  SnapshotCreate: 'Snapshot create',
  SnapshotRevert: 'Snapshot revert',
  SnapshotDelete: 'Snapshot delete',
  Stop: 'Stop',
  Submit: 'Submit',
  Success: 'Success',
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
  UpdateProvider: 'Update Provider',
  UpdateScheduleAction: 'Update schedule action: %s',
  UpdateServiceTemplate: 'Update Service Template',
  UpdateVirtualRouterTemplate: 'Update Virtual Router Template',
  UpdateVirtualNetwork: 'Update Virtual Network',
  UpdateVirtualNetworkTemplate: 'Update Virtual Network Template',
  UpdateVmConfiguration: 'Update VM Configuration',
  UpdateVmTemplate: 'Update VM Template',
  UpdateMarketplace: 'Update Marketplace',

  /* questions */
  Yes: 'Yes',
  No: 'No',
  DoYouWantProceed: 'Do you want to proceed?',

  /* Scheduling */
  Action: 'Action',
  ScheduleAction: 'Schedule action',
  ScheduledActions: 'Scheduled Actions',
  ScheduleActionType: 'Schedule action type',
  Charter: 'Charter',
  OneTimeAction: 'One time',
  PeriodicAction: 'Periodic',
  RelativeAction: 'Relative',
  DoneAgo: 'Done %s',
  NextInTime: 'Next in %s',
  FirstTime: 'First time %s',
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
  Daily: 'Daily',
  Weekly: 'Weekly',
  Monthly: 'Monthly',
  Yearly: 'Yearly',
  Hourly: 'Hourly',
  Years: 'years',
  Months: 'months',
  Weeks: 'weeks',
  Days: 'days',
  Hours: 'hours',
  Minutes: 'minutes',
  EachHours: 'Each %s hours',
  AfterTimes: 'After %s times',
  Today: 'Today',
  Periodic: 'Periodic',
  Time: 'Time',
  TimeAfterTheVmIsInstantiated: 'Time after the VM is instantiated',
  PeriodType: 'Period type',
  GranularityOfAction: 'Granularity of the action',
  DayOfWeek: 'Day of week',
  DayOfMonth: 'Day of month',
  DayOfYear: 'Day of year',
  EachXHours: "Each 'x' hours",
  EndType: 'End type',
  DaysBetween0_6: 'Days should be between 0 (Sunday) and 6 (Saturday)',
  DaysBetween1_31: 'Days should be between 1 and 31',
  DaysBetween0_365: 'Days should be between 0 and 365',
  HoursBetween0_168: 'Hours should be between 0 and 168',
  WhenDoYouWantThisActionToStop: 'When do you want this action to stop?',
  HowManyTimesDoYouWantThisActionToExecute:
    'How many times do you want this action to execute?',
  NumberOfRepetitions: 'Number of Repetitions',
  In: 'in',
  WarningBefore: 'Warning before',
  Never: 'Never',
  Repetition: 'Repetition',
  Date: 'Date',

  /* footer */
  MadeWith: 'Made with',
  NotOfficiallySupport: 'Not Officially Supported',
  OfficiallySupport: 'Officially Supported',

  /* dashboard */
  InTotal: 'In Total',
  Used: 'Used',

  /* login */
  Username: 'Username',
  Password: 'Password',
  ConfirmPassword: 'Confirm Password',
  PasswordsMustMatch: 'Passwords must match',
  ChangePassword: 'Change password',
  ChangePasswordSuccess: 'Succesfully changed password',
  ChangePasswordAdminWarning:
    'Users oneadmin and serveradmin can not change theirs passwords using Sunstone.',
  ChangePasswordAdminWarningLink:
    'See OpenNebula documentation to get more details.',
  ChangePasswordLdapWarning:
    'Users with authentication driver LDAP can not change theirs passwords using Sunstone.',
  Token2FA: '2FA Token',
  GetAuthenticatorApp: 'Get authenticator app: ',
  ScanThisQr: 'Scan this Qr',
  EnterVerificationCode: 'Enter Verification Code',
  TwoFactorAuthentication: 'Two Factor Authentication',
  RegisterAuthenticationApp: 'Register authentication App',
  AuthenticatorAppSunstone: 'Authenticator app (HOTP) [Legacy]',
  AuthenticatorApp: 'Authenticator app (HOTP)',
  KeepLoggedIn: 'Keep me logged in',
  KeepLast: 'Keep Last',
  KeepAliveID: 'Keepalive service ID',
  KeepAlivePass: 'Keepalive password',
  Credentials: 'Credentials',
  SwitchView: 'Switch view',
  SwitchGroup: 'Switch group',
  TakeMeToTheAppGui: 'Take me to the %s GUI',

  /* errors */
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
  Error: 'Error',
  Debug: 'Debug',
  Message: 'Message',
  AllSeverities: 'All Severities',
  Outdated: 'Outdated',
  Updated: 'Updated',
  Updating: 'Updating',
  Reserved: 'Reserved',
  Vrouter: 'Vrouter',
  SessionExpired: 'Sorry, your session has expired',
  WrongUsernamePassword: 'Wrong username or password',
  OnlyForOneadminGroup:
    'Only members of the oneadmin group can access OneProvision functionality',
  SomethingWrong: 'Something go wrong',
  CannotConnectOneFlow: 'Cannot connect to OneFlow server',
  CannotConnectOneProvision: 'Cannot connect to OneProvision server',
  ErrorOneProvisionGUI:
    'FireEdge is not correctly configured to operate the OneProvision GUI',
  ContactYourAdmin: 'Please contact your system administrator',
  NotFound: 'Not found',
  Timeout: 'Timeout',
  None: 'None',
  Empty: 'Empty',
  NoDataAvailable: 'There is no data available',
  ErrorsOcurred: '%s error(s) occurred',
  AttachNicSuccess: 'NIC attached successfully - Virtual machine #%s',
  DetachNicSuccess: 'NIC detached successfully - Virtual machine #%s',
  UpdatedNicSuccess: 'NIC updated successfully - Virtual machine #%s',
  AttachAliasSuccess: 'Alias attached successfully - Virtual machine #%s',
  DetachAliasSuccess: 'Alias detached successfully - Virtual machine #%s',
  ErrorUpdatingSecGroups: 'VMs in error. The Update to the latest rules failed',
  PendingUpdatingSecGroups: 'VMs waiting to be updated with the latest rules',
  Unknown: 'Unknown',

  /* steps form */
  AdvancedOptions: 'Advanced options',
  AdvancedParams: 'Advanced Parameters',
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
  Log: 'Log',
  AddIP: 'Add IP',
  AddHost: 'Add Host',
  Cleanup: 'Cleanup',
  CleanupConcept: 'Delete all vms and images first, then delete the resources',
  Force: 'Force',
  ForceConcept: 'Force configure to execute',
  ConfigureProvision: 'Configure provision %s',

  /* sections */
  Dashboard: 'Dashboard',

  /* sections - settings */
  Settings: 'Settings',
  Schema: 'Schema',
  Dark: 'Dark',
  Light: 'Light',
  System: 'System',
  Language: 'Language',
  View: 'View',
  DefaultZoneEndpoint: 'Default Endpoint',
  Endpoint: 'Endpoint',
  LinkOtherConfigurationsUser: 'More user configurations',
  MessageLoginToken:
    'A login token acts as a password and can be used to authenticate with OpenNebula through  CLI, or the API',
  Expiration: 'Expiration, in seconds',
  LoginToken: 'Login Token',
  DisableDashboardAnimations: 'Disable dashboard animations',
  Token: 'Token',
  GetNewToken: 'Get a new token',
  ConfigurationUI: 'Configuration UI',
  ValidUntil: 'Valid until',
  Authentication: 'Authentication',
  AuthType: 'Authentication Type',
  SshPrivateKey: 'SSH private key',
  AddUserSshPrivateKey: 'Add user SSH private key',
  SshPassphraseKey: 'SSH private key passphrase',
  AddUserSshPassphraseKey: 'Add user SSH private key passphrase',
  Labels: 'Labels',
  NewLabelOrSearch: 'New label or search',
  LabelAlreadyExists: 'Label already exists',
  PressToCreateLabel: 'Press enter to create a new label',
  SavesInTheUserTemplate: "Saved in the User's template",
  NoLabelsOnList: 'You have not defined any labels, list is empty',

  /* sections - support */
  Support: 'Support',
  CommercialSupport: 'Commercial Support',
  CommercialSupportRequests: 'Commercial Support Requests',
  SupportInformation: `
  The Support Subscription provides expert integration and 
  production support on supported platforms and include:
  `,
  DiagnosisResolutionBugFix: 'Problem diagnosis, resolution and bug fixing',
  SolveUnexpectedProblems:
    'Solving unexpected problems when using, installing or configuring the software',
  GuidanceEnvironment:
    'Guidance about tuning for optimal and scalable performance in your environment',
  AnswerHowToQuestions:
    'Answering “how to” questions related to standard and intended product usage',
  WorkArounds: 'Offering hints about how to go around missing features',
  AnswerQuestions:
    'Answering questions about product adaptation and integration',
  MoreInformation: 'For more info on support subscriptions, ',
  ClickHere: 'Click here',
  AdditionalHelpResources: 'Additional Help Resources',
  Documentation: 'Documentation',
  Community: 'Community',
  Email: 'Email',
  GetAnAccount: 'Get an account',
  Or: 'Or',
  SubmitRequest: 'Submit Request',
  SupportLogOut: 'Support log out',
  Created: 'Created',
  Severity: 'Severity',
  Category: 'Category',
  Resolution: 'Resolution',
  Severity4:
    'Severity 4. Usage, Design, Configuration, or Integration Question',
  Severity3:
    'Severity 3. Product Error: Low impact problem on a running production system',
  Severity2:
    'Severity 2. Product Error: High-impact impact problem on a running production system',
  Severity1:
    'Severity 1. Product Error: Catastrophic impact problem on a running production system',
  Subject: 'Subject',
  Status: 'Status',
  ProductError: 'Product error',
  IntegrationAssistance: 'Integration assistance',
  FeatureEnhancement: 'Feature enhancement',
  TechnicalAssistance: 'Technical assistance',
  Duplicate: 'Duplicate',
  WorksForMe: 'Works for me',
  LackOfInformation: 'Lack of information',
  WontFix: "Won't fix",
  Attachments: 'Attachments',
  Normal: 'Normal',
  Urgent: 'Urgent',
  Comment: 'Comment',
  WeSupportMarkdown: 'We support markdown',
  ResolutionTicket:
    'You should just use this. If you want to place the ticket as solved',
  AddComment: 'Add comment to close the ticket',

  /* sections - system */
  User: 'User',
  Users: 'Users',
  Group: 'Group',
  Groups: 'Groups',
  PrimaryGroup: 'Primary Group',
  SecondaryGroups: 'Secondary Groups',
  VDC: 'VDC',
  VDCs: 'VDCs',
  ACL: 'ACL',
  ACLs: 'ACLs',
  DatastoreSize: 'Datastore Size',
  VMCount: 'VM Count',
  NetworkLeases: 'Network Leases',
  ImageRVMS: 'Image RVMS',
  Quota: 'Quota',
  Accounting: 'Accounting',
  VMQuota: 'VM Quota',
  DatastoreQuota: 'Datastore Quota',
  NetworkQuota: 'Network Quota',
  ImageQuota: 'Image Quota',
  ResourceIds: 'Resource IDs',
  ResourceIdsConcept: 'Select or type a Resource ID',
  ResourceIdsInvalid:
    'Invalid format or duplicate ID. Please enter a positive number.',
  QuotaControls: 'Quota Controls',
  RunningMemory: 'Running Memory',
  RunningCPU: 'Running CPU',
  RunningCPULower: 'Running Cpu',
  SystemDiskSize: 'System Disk Size',
  CPU: 'CPU',
  CPULower: 'Cpu',
  QuotaHelpTitle: 'How to use Quota Controls',
  QuotaHelpStep1: 'Select the quota type from the dropdown.',
  QuotaHelpStep2: '(Optional) Individual Resource Quotas.',
  QuotaHelpStep2Tooltip: 'enter Resource IDs over which this quota will apply',
  QuotaHelpStep3: 'Select identifiers for the quota.',
  QuotaHelpStep3Tooltip:
    'this further qualifies the quota type to a more specific attribute',
  QuotaHelpStep4: 'Enter the value for the selected quota.',
  QuotaHelpStep5: 'Click Apply to set the quotas.',
  GroupBy: 'Group By',
  ChartType: 'Chart Type',
  LineChart: 'Line Chart',
  BarChart: 'Bar Chart',
  AreaChart: 'Area Chart',
  TableChart: 'Table Chart',
  CPUHours: 'CPU Hours',
  MemoryGBHours: 'Memory GB Hours',
  DiskMBHours: 'Disk MB Hours',
  ExportCSV: 'Export as CSV',
  ExportPDF: 'Export as PDF',
  Export: 'Export',
  TotalCost: 'Total Cost',
  Month: 'Month',
  AuthenticationDriver: 'Authentication driver',
  EditPublicSSHKey: 'Edit Public SSH Key',
  EditPrivateSSHKey: 'Edit Private SSH Key',
  EditSSHKeyPassphrase: 'Edit SSH Key Passphrase',
  SaveChanges: 'Save Changes',
  PasteSSHKey: 'Paste your SSH Key here...',
  PastePrivateSSHKey: 'Paste your Private SSH Key here...',
  EnterPassphrase: 'Enter your passphrase...',

  /* sections - infrastructure */
  Cluster: 'Cluster',
  Clusters: 'Clusters',
  Host: 'Host',
  Hosts: 'Hosts',
  Infrastructure: 'Infrastructure',
  Zone: 'Zone',
  Zones: 'Zones',
  Vnet: 'Vnet',
  'cluster.form.create.general.help.title': 'Cluster',
  'cluster.form.create.general.help.paragraph.1.1':
    'Clusters group together hosts, datastores and virtual networks that are configured to work together. A cluster is used to:',
  'cluster.form.create.general.help.paragraph.1.2':
    'Ensure that VMs use resources that are compatible.',
  'cluster.form.create.general.help.paragraph.1.3':
    'Assign resources to user groups by creating Virtual Private Clouds.',
  'cluster.form.create.general.help.paragraph.2':
    'Please, select a name for the cluster',
  'cluster.form.create.help.link':
    'See OpenNebula documentation to get more details about clusters.',
  'cluster.form.create.hosts.help.title': 'Hosts',
  'cluster.form.create.hosts.help.paragraph.1':
    'Please, select one or more hosts in the hosts table. Hosts are not mandatory, so you can skip this step.',
  'cluster.form.create.hosts.help.paragraph.2':
    'Remember that hosts can be in only one cluster at a time so if a host it is added to this cluster, it will be removed from any other cluster.',
  'cluster.form.create.vnets.help.title': 'Virtual Networks',
  'cluster.form.create.vnets.help.paragraph.1':
    'Please, select one or more virtual networks in the virtual networks table. Virtual networks are not mandatory, so you can skip this step.',
  'cluster.form.create.vnets.help.paragraph.2':
    'Virtual networks can be added to multiple clusters. This means that any host in those clusters is properly configured to use leases from those virtual networks.',
  'cluster.form.create.datastores.help.title': 'Datastores',
  'cluster.form.create.datastores.help.paragraph.1':
    'Please, select one or more datastores in the datastores table. Datastores are not mandatory, so you can skip this step.',
  'cluster.form.create.datastores.help.paragraph.2':
    'Datastores can be added to multiple clusters. This means that any host in those clusters is properly configured to run VMs using images from those datastores.',
  'cluster.form.create.datastores.help.paragraph.3':
    'Remember that in order to create a complete environment where the scheduler can deploy VMs, your clusters need to have at least one System Datastore.',
  'host.form.create.general.name':
    'FQDN or IP that OpenNebula can use to reach the hypervisor host',
  'host.form.create.general.name.tooltip':
    "Please make sure the OpenNebula front-end can ssh passwrodlessly to the host using the 'oneadmin' user",

  /* sections - network */
  Network: 'Network',
  Networks: 'Networks',
  VirtualNetwork: 'Virtual network',
  VirtualNetworks: 'Virtual networks',
  RoleNetwork: 'Role Network',
  RoleNetworks: 'Role Networks',
  NetworkTemplate: 'Network Template',
  NetworkTemplates: 'Network Templates',
  NetworkTopology: 'Network topology',
  NetworksTopologies: 'Networks topologies',
  SecurityGroup: 'Security group',
  SecurityGroups: 'Security groups',
  NoNetworksInMonitoring:
    'There is currently no network monitoring information associated with this VM',

  /* sections - vdc */
  Resources: 'Resources',
  SelectAllResourcesFromZone: 'Select all %s resources from %s zone (Zone #%s)',

  /* sections - storage */
  Backups: 'Backups',
  BackupDatastore: 'Backup Datastore',
  BackupRestored: 'Backup restored',
  BackupJobRefresh:
    'There are machines in outdated, you can refresh to see if the backups are already done',
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
  Os: 'Operating system image',
  Cdrom: 'Readonly CD-ROM',
  Datablock: 'Generic storage datablock',
  Path: 'Path/URL',
  ImagePath: 'Path in OpenNebula server or URL',
  Upload: 'Upload',
  ErrorUpload: 'Error Upload',
  EmptyDisk: 'Empty disk image',
  ImageSize: 'Image size, in Megabytes',
  ImageSizeUnit: 'Image size',
  Vd: 'Virtio',
  Sd: 'SCSI/SATA',
  Hd: 'Parallel ATA (IDE)',
  CustomBus: 'Custom bus',
  Fs: 'Fs',
  CustomFormat: 'Custom Format',
  Running: 'Running',
  DoNotRestoreNICAttributes: 'Do not restore NIC attributes',
  DoNotRestoreIPAttributes: 'Do not restore IP attributes',
  RestoreIndividualDisk: 'Restore individual disk',
  Full: 'Full',
  Increment: 'Increment',
  Increments: 'Increments',
  Incremental: 'Incremental',
  Mode: 'Mode',
  ResetBackup: 'Reset',
  IncrementMode: 'Increment Mode',
  IncrementId: 'Increment ID',
  RestoreBackup: 'Restore backup',
  RestoreVm: 'Restore VM',
  BackupJobs: 'BackupJobs',
  BackupJob: 'BackupJob',

  /* storage backends */
  StorageBackend: 'Storage backend',
  DatastoreType: 'Datastore type',
  FilesystemShared: 'Filesystem - shared mode',
  FilesystemSSH: 'Filesystem - SSH mode',
  Ceph: 'Ceph',
  LVM: 'LVM',
  RawDeviceMapping: 'Raw device mapping',
  StorageRestic: 'Backup - Restic (EE only)',
  StorageRsync: 'Backup - RSync',

  /* datastore */
  Transfer: 'Transfer',
  CustomDSMAD: 'Custom DS_MAD',
  CustomTMMAD: 'Custom TM_MAD',
  Filesystem: 'Filesystem',
  Devices: 'Devices',
  Shared: 'Shared',
  SSH: 'SSH',
  FSLVM: 'FS LVM',
  ConfigurationAttributes: 'Configuration attributes',
  RestrictedDirs: 'Restricted directories',
  SafeDirs: 'Safe directories',
  StorageUsageLimit: 'Storage usage limit (in MB)',
  TransferBandwidthLimit: 'Transfer bandwidth limit (B/s)',
  DoNotTryToUntarOrDecompress: 'Do not try to untar or decompress',
  CheckDSCapacityBeforeCreatingImage:
    'Check available capacity of the Datastore before creating a new Image',
  HostBridgeList: 'Host bridge list',
  CephPoolToStoreImages: 'Ceph pool to store images',
  CephHost: 'Ceph host',
  CephUser: 'Ceph user',
  CephSecret: 'Ceph secret',
  CephUserConcept: 'The username to interact with the Ceph cluster',
  CephSecretConcept: 'A generated UUID for a LibVirt secret',
  ResticPassword: 'Restic password',
  ResticSFTPUser: 'Restic SFTP user',
  ResticSFTPServer: 'Restic SFTP server',
  Priority: 'Priority',
  BackupIOPriority: 'Backup I/O priority',
  BackupIOPriorityConcept:
    'Run restic operations under a given ionice priority using the best-effort I/O scheduler',
  BackupCPUPriority: 'Backup CPU priority',
  BackupCPUPriorityConcept:
    'Run restic operations with a given scheduler priority (nice)',
  BandwidthLimit: 'Bandwidth limit',
  BandwidthLimitConcept: 'limit download and upload to a maximum rate in KiB/s',
  NumberOfConcurrentConnections: 'Number of concurrent connections',
  NumberOfConcurrentConnectionsConcept:
    'Set the number of concurrent connections to the backup backend (default is 5)',
  MaximumReadIOPS: 'Maximum read IOPS',
  MaximumReadIOPSConcept:
    'Run backups in a systemd slice, limiting the max number of read IOPS',
  MaximumWriteIOPS: 'Maximum write IOPS',
  MaximumWriteIOPSConcept:
    'Run backups in a systemd slice, limiting the max number of write IOPS',
  CPUQuota: 'CPU quota',
  CPUQuotaConcept:
    'Run backups in a systemd slice with a given cpu quota (percentage). Use > 100 for using several CPUs',
  DatastoreQuotas: 'Datastore quotas',
  NetworkQuotas: 'Network quotas',
  ImageQuotas: 'Image quotas',
  VmQuotas: 'VM quotas',
  CompressionLevel: 'Compression level',
  CompressionLevelConcept:
    'Compress backups in the datastore, it needs a Restic repository with format version 2',
  RsyncHost: 'Rsync host',
  RsyncUser: 'Rsync user',
  VolumeGroupName: 'Volume group name',
  GlusterHost: 'Gluster host',
  GlusterHostConcept:
    'Host and port of one (and only one) Gluster server (host:port)',
  GlusterVolume: 'Gluster volume',
  GlusterVolumeConcept: 'Gluster volume to use for the datastore',
  RDBFormat: 'RDB format',
  CephConfigurationFilePath: 'Ceph configuration file path',
  CephConfigurationFilePathConcept:
    'Needed if using a non-default path for the ceph configuration file',
  CephKeyfile: 'Ceph keyfile',
  CephKeyfileConcept: 'File containing the secret key of user',

  CompatibleSystemDatastores: 'Compatible system datastores',
  CompatibleSystemDatastoresConcept:
    'Specifies which system datastores are compatible with this image datastore',
  StagingDirectoryForImageRegistration:
    'Staging directory for Image registration',
  AdapterTypeUsedByVirtualDisksVMs: 'Adapter type used by virtual disks VMs',
  TypeOfDiskToBeCreated: 'Type of disk to be created',
  ManagedObjectReferenceOfTheDatastore:
    'Managed Object Reference of the datastore',
  MaxNumberOSThreads: 'Max number of OS threads',
  MaxNumberOSThreadsConcept:
    'Sets GOMAXPROCS for restic to limit the OS threads that execute user-level Go code simultaneously.',
  Sparsify: 'Sparsify',
  SparsifyConcept:
    'Runs virt-sparsify on flatten backups to reduce backup size. It requires libguestfs package.',
  Arguments: 'Arguments',
  RsyncArgumentsConcept:
    'Command line arguments for rsync command (Default: -az)',
  TemporalDirectory: 'Temporal directory',
  TemporalDirectoryConcept:
    'Temporary Directory used for rebasing incremental images (Default: /var/tmp)',
  StandaloneQcow2Clone: 'Standalone qcow2 clone',
  StandaloneQcow2CloneConcept:
    'Clone qcow2 without a backing chain and no dependencies with Image datastore files',

  /* VDC */
  AllClustersAreIncludedInThisVDC: 'All clusters are included in this VDC',
  AllHostsAreIncludedInThisVDC: 'All hosts are included in this VDC',
  AllDatastoresAreIncludedInThisVDC: 'All datastores are included in this VDC',
  AllVNetworksAreIncludedInThisVDC:
    'All virtual networks are included in this VDC',

  /* sections - templates & instances */
  Instances: 'Instances',
  VM: 'VM',
  VMs: 'VMs',
  VirtualMachines: 'Virtual Machines',
  VmsTab: 'Vms',
  VMsBackupJob: 'VMs in BackupJob',
  VMsBackupJobError: 'VMs in error',
  VMsBackupJobBackingUp: 'VMs Backing Up',
  VMsBackupJobOutdated: 'VMs Outdated',
  VMsBackupJobBackingUpState: 'Backing Up',
  VMsBackupJobOutdatedState: 'Outdated',
  VMsBackupJobOrder: 'VM List (ordered)',
  VirtualRouter: 'Virtual router',
  VirtualRouters: 'Virtual Routers',
  VMGroup: 'VM Group',
  VMGroups: 'VM Groups',
  Templates: 'Templates',
  VMTemplate: 'VM Template',
  VMTemplates: 'VM Templates',
  Service: 'Service',
  Services: 'Services',
  ServiceTemplate: 'Service Template',
  ServiceTemplates: 'Service Templates',
  VirtualRouterTemplate: 'Virtual Router Template',
  VirtualRouterTemplates: 'Virtual Router Templates',
  VirtualRouterNICStart: 'Add a NIC to Start Configuring',
  VirtualRouterNICStart1:
    'In a Virtual Router, a Network Interface Card (NIC) is crucial for managing network traffic efficiently. By adding a NIC, you unlock the ability to create virtual networks and route traffic between virtual machines, ensuring secure and efficient communication within your cloud environment.',
  VirtualRouterNICStart2:
    'Just add a NIC to your configuration, and you&apos;ll gain access to configure network settings for your virtual routers. This includes setting up IP addresses, Security Groups, and more, making your cloud environment more manageable and secure.',
  VirtualRouterNICConfigured: "Configured NIC's",
  VirtualRouterNICAdd: 'Add NIC',
  VirtualRouterNICNetworkName: 'Network name',
  VirtualRouterNICNetworkConfiguration: 'Network configuration',
  VirtualRouterNICForceIpv4: 'Force IPv4',
  VirtualRouterNICFloatingIP: 'Floating IP',
  VirtualRouterNICForceIpv6: 'Force IPv6',
  VirtualRouterUserInputsShowMandatory: 'Show mandatory only',
  TotalVms: 'Total VMs',

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
  Drivers: 'Drivers',
  General: 'General',
  Extra: 'Extra',
  Information: 'Information',
  Placement: 'Placement',
  ServerPool: 'Server Pool',

  /* general schema */
  ID: 'ID',
  Name: 'Name',
  State: 'State',
  Size: 'Size',
  SizeUnit: 'Unit size',
  SizeUnitTooltip: 'Choose unit of size',
  SizeOnUnits: 'Size on %s',
  Description: 'Description',
  RegistrationTime: 'Registration time',
  StartTime: 'Start time',
  Started: 'Started',
  NotStartedYet: 'Not started yet',
  OnGoing: 'On Going',
  StartedOnTime: 'Started on %s',
  Total: 'Total',
  Prolog: 'Prolog',
  EndTime: 'End time',
  Locked: 'Locked',
  Attributes: 'Attributes',
  Type: 'Type',
  Data: 'Data',
  Validate: 'Validate',
  Format: 'Format',
  Prefix: 'Prefix',
  More: 'More',
  UsedOfTotal: 'Used / Total',

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
  DeployID: 'Deploy ID',
  Deployment: 'Deployment',
  Monitoring: 'Monitoring',
  EdgeCluster: 'Edge Cluster',

  /* VM schema */
  /* VM schema - remote access */
  Vnc: 'VNC',
  Ssh: 'SSH',
  Rdp: 'RDP',
  SshConnection: 'SSH connection',
  RdpConnection: 'RDP connection',
  Vmrc: 'VMRC',
  Sdl: 'SDL',
  Spice: 'SPICE',
  CtrlAltDel: 'Ctrl-Alt-Del',
  Reconnect: 'Reconnect',
  FullScreen: 'Full screen',
  FullScreenInfo: 'Full screen information in datatables',
  Screenshot: 'Screenshot',
  LastConnection: 'Last connection',
  PartOf: 'Part of',
  GuacamoleState: 'Guacamole State',
  VMRCState: 'VMRC State',
  RdpLayout: 'RDP keyboard layout',
  RdpResizeMethod: 'RDP resize method',
  DisableAudio: 'Disable audio',
  EnableAudioInput: 'Enable audio input',
  EnableWallpaper: 'Render desktop wallpaper',
  EnableTheming: 'Render windows theming control',
  EnableFontSmoothing: 'Enable font smoothing',
  EnableFullWindowDrag: 'Enable full window drag',
  EnableDesktopComposition: 'Enable desktop composition',
  EnableMenuAnimations: 'Enable menu animations',
  DisableBitmapCaching: 'Disable bitmap caching',
  DisableOffscreenCaching: 'Disable offscreen caching',
  DisableGlyphCaching: 'Disable glyph caching',
  Timezone: 'Timezone',
  /* VM schema - info */
  VmName: 'VM name',
  VNName: 'Virtual Network Name',
  UserTemplate: 'User Template',
  Template: 'Template',
  SelectTemplate: 'Select template',
  WhereIsRunning:
    'VM %1$s is currently running on Host %2$s and Datastore %3$s',
  /* VM schema - capacity */
  Capacity: 'Capacity',
  PhysicalCpu: 'Physical CPU',
  PhysicalCpuWithPercent: 'Physical CPU (%)',
  VirtualCpu: 'Virtual CPU',
  VirtualCpuWithDecimal: 'Virtual CPU',
  VirtualCores: 'Virtual Cores',
  Cores: 'Cores',
  Sockets: 'Sockets',
  Memory: 'Memory',
  MemoryWithUnit: 'Memory %s',
  MemoryUnit: 'Unit memory',
  Cost: 'Cost',
  CostEachMonth: '%s / month',
  CostCpu: 'Cost / CPU',
  CostCpuConcept: 'Cost of each CPU per hour',
  CostMemory: 'Cost / Memory',
  CostMemoryConcept: 'Cost of each memory MB per hour',
  CostDiskConcept: 'Cost of each disk GB per hour',
  /* VM schema - storage */
  Storage: 'Storage',
  Disk: 'Disk',
  Disks: 'Disks',
  Volatile: 'Volatile',
  VolatileDisk: 'Volatile disk',
  Snapshot: 'Snapshot',
  SnapshotName: 'Snapshot name',
  DiskSnapshot: 'Disk snapshot',
  DiskSize: 'Disk size',
  NewImageName: 'New Image name',
  NewImageNameConcept: 'Name for the new Image where the disk will be saved',
  /* VM schema - network */
  NIC: 'NIC',
  Alias: 'Alias',
  NICAlias: 'NIC Alias',
  CreateAlias: 'Create alias',
  AttachAlias: 'Attach alias',
  AsAnAlias: 'Attach as an alias',
  HasAlias: '%s contains %s alias',
  NetworkAuto: 'Network auto',
  NetReq: 'Network Requirements',
  NetReqTooltip: 'Boolean expression that decides suitable vnets for this VM',
  NetRank: 'Network Rank',
  NetRankTooltip:
    'This field sets which attribute will be used to sort the suitable vnets for this VM',
  AutomaticNetworkMode: 'Automatic select virtual network',
  NetworkModeConcept:
    'Thee Schedule will decide which is the best virtual network',
  SkipNetworkContextualization: 'Skip network contextualization',
  SkipNetworkContextualizationConcept:
    'A virtual router can be configured to route SDNAT traffic for this NIC IP address',
  OverrideNetworkValuesIPv4: 'Override Network Values IPv4',
  OverrideNetworkValuesIPv6: 'Override Network Values IPv6',
  OverrideNetworkInboundTrafficQos: 'Override Network Inbound Traffic QoS',
  OverrideNetworkOutboundTrafficQos: 'Override Network Outbound Traffic QoS',
  AttachSecurityGroup: 'Attach Security Group',
  DetachSecurityGroup: 'Detach Security Group',
  DetachSecurityGroupFromNic: 'Detach Security Group %1$s from NIC %2$s',
  PortForwarding: 'Port forwarding',
  HostnamePortsForwardedToVmPorts: '%1$s ports %2$s forwarded to VM ports %3$s',
  VirtualNicHardwareMode: 'Virtual NIC hardware mode',
  Emulated: 'Emulated',
  PCIPassthroughAutomatic: 'PCI Passthrough - Automatic',
  PCIPassthroughManual: 'PCI Passthrough - Manual',
  AttachPci: 'Attach PCI device',
  AttachPciSuccess: 'PCI attached successfully - Virtual machine #%s',
  DetachPci: 'Detach PCI device',
  DetachPciSuccess: 'PCI detached successfully - Virtual machine #%s',
  PCISpecificDevice: 'Specific device',
  PCISpecificDeviceHelp:
    'Check if you want to specify a short address of a PCI device',
  ShortAddress: 'Short address',
  NicPciWarning:
    ' PCI passthrough of network devices is configured per NIC, in the "Network" tab. Do not add network devices here.',
  PciAttachWarning: 'PCI only can be attach or detach in POWEROFF state.',
  /* VM schema - Pci */
  Pci: 'Pci',
  /* VM schema - snapshot */
  VmSnapshotNameConcept: 'The new snapshot name. It can be empty',
  VmSnapshotHint: `
    Snapshots in this tab refer to System Snapshots, which includes all disks and
    the memory state of the VM. For disk snapshots, see the Storage tab`,
  VmSnapshotNotAvailable: 'Taking snapshots is not available.',
  VmSnapshotReferLogs:
    'If none of the above worked, please refer to the VM monitoring logs.',
  /* VM schema - actions */
  EnforceCapacityChecks: 'Enforce capacity checks',
  EnforceCapacityChecksConcept: `
    If it is set to true, the host capacity will be checked.
    This will only affect oneadmin requests, regular users
    resize requests will always be enforced`,
  RecoverDescription: `
    Recovers a stuck VM that is waiting for a driver operation.
    The recovery may be done by failing, succeeding or retrying the
    current operation. YOU NEED TO MANUALLY CHECK THE VM STATUS ON THE HOST,
    to decide if the operation was successful or not, or if it can be retried`,
  Operation: 'Operation',
  OperationConceptFailure: 'Recover a VM by failing the pending action',
  OperationConceptSuccess: 'Recover a VM by succeeding the pending action',
  OperationConceptRetry: 'Recover a VM by retrying the last failed action',
  OperationConceptDelete: 'No recover action possible, delete the VM',
  OperationConceptRecreate:
    'No recover action possible, delete and recreate the VM',
  OperationConceptDeleteDb: `
  No recover action possible, delete the VM from the DB.
  It does not trigger any action on the hypervisor`,
  RecoverDescriptionVNet: `
    Recovers a stuck Virtual Network after an update operation that didn't 
    finish successfully, since updating a Virtual Network implies updating 
    the corresponding Virtual Machine NICs. The recovery may be done by failing, 
    succeeding or retrying the current operation; or deleting the Virtual Network. 
    You need to manually check the affected VMs and the network resources on the
    infrastructure to decide if the operation was successful or not, or if
    it can be retried.`,
  OperationConceptFailureVNet:
    'Recover a Virtual Network by failing the pending action',
  OperationConceptSuccessVNet:
    'Recover a Virtual Network by succeeding the pending action',
  OperationConceptRetryVNet:
    'Recover a Virtual Network by retrying the last failed action',
  OperationConceptDeleteVNet:
    'No recover action possible, delete the Virtual Network',
  /* VM schema - history */
  History: 'History',
  RequestId: 'Request ID',
  TimeWhenTheStateChanged: 'Time when the state changed',
  TotalTimeInThisState: 'Total time in this state',
  PrologTimeForThisState: 'Prolog time for this state',
  /* VM schema - history */
  SchedActions: 'Sched actions',

  /* VM Template schema */
  /* VM Template schema - general */
  Custom: 'Custom',
  CustomVariables: 'Custom Variables',
  CustomAttributes: 'Custom Attributes',
  Hypervisor: 'Hypervisor',
  Logo: 'Logo',
  MakePersistent: 'Make Persistent',
  MakeNewImagePersistent: 'Make the new images persistent',
  TemplateName: 'Template name',
  Virtualization: 'Virtualization',
  CustomInformation: 'Custom information',
  CustomVirtualization: 'Custom virtualization',
  VnTemplateNameHelper: `
    Defaults to 'template name-<vmid>' when empty.
    When creating several Virtual Network, the wildcard %%idx will be replaced with a number starting from 0`,
  VmTemplateNameHelper: `
    Defaults to 'template name-<vmid>' when empty.
    When creating several VMs, the wildcard %%idx will be
    replaced with a number starting from 0`,
  NumberOfInstances: 'Number of instances',
  NumberOfVms: 'Number of VMs',
  MakeTemplateAvailableForVROnly:
    'Make this template available for Virtual Router machines only',
  VmOnHoldState: 'Start VM on hold state',
  VmOnHoldStateConcept: `
    Sets the new VM to hold state, instead of pending.
    The scheduler will not deploy VMs in this state.
    It can be released later, or deployed manually`,
  InstantiateAsPersistent: 'Instantiate as persistent',
  InstantiateAsPersistentConcept: `
    Creates a private persistent copy of the template
    plus any image defined in DISK, and instantiates that copy`,
  /* VM schema - ownership */
  InstantiateAsUser: 'Instantiate as different User',
  InstantiateAsGroup: 'Instantiate as different Group',
  /* VM Template schema - storage */
  StorageOptions: 'Storage Options',
  DeployMode: 'Deploy Mode',
  DeployModeConcept: 'Set an alternative mode to deploy VM disks to the hosts',
  /* VM Template schema - network */
  NetworkDefaults: 'Network Defaults',
  NetworkDefaultsConcept: `
    Values that will be copied to each new NIC.
    Final users may not be aware of this`,
  DefaultNicModel: 'Default hardware model to emulate for all NICs',
  DefaultNicFilter: 'Default network filtering rule for all NICs',
  Ipv4Static: 'Static (Based on context)',
  Ipv4Dhcp: 'DHCP (DHCPv4)',
  Ipv4Skip: 'Skip (Do not configure IPv4)',
  Ipv6Static: 'Static (Based on context)',
  Ipv6Auto: 'Auto (SLAAC)',
  Ipv6Dhcp: 'DHCP (SLAAC and DHCPv6)',
  Ipv6Disable: 'Disable (Do not use IPv6)',
  Ipv6Skip: 'Skip (Do not configure IPv6)',
  /* VM Template schema - capacity */
  MaxMemory: 'Max memory',
  MaxMemoryConcept: `
    This value sets the maximum value of the MEMORY allowed to be modified
    after instantiation, through the Capacity Resize options of instantiated VMs`,
  MemoryModification: 'Memory modification',
  AllowUsersToModifyMemory:
    "Allow users to modify this template's default memory on instantiate",
  MemoryConcept: 'Amount of RAM required for the VM',
  MemoryConceptUnit: 'Choose unit of memory',
  MemoryConceptUserInput: '(This value is represented in MB)',
  CpuConcept: `
    Percentage of CPU divided by 100 required for the
    Virtual Machine. Half a processor is written 0.5`,
  MaxVirtualCpu: 'Max Virtual CPU',
  MaxVirtualCpuConcept: `
    This value sets the maximum value of the VCPU allowed to be modified
    after instantiation, through the Capacity Resize options of instantiated VMs`,
  CpuModification: 'CPU modification',
  AllowUsersToModifyCpu:
    "Allow users to modify this template's default CPU on instantiate",
  VirtualCpuConcept: `
    Number of virtual cpus. This value is optional, the default
    hypervisor behavior is used, usually one virtual CPU`,
  VirtualCpuModification: 'Virtual CPU modification',
  AllowUsersToModifyVirtualCpu:
    "Allow users to modify this template's default Virtual CPU on instantiate",
  EnableHotResize: 'Enable hot resize',
  Hotplug: 'Hotplug',
  Ballooning: 'Ballooning',
  MemoryResizeMode: 'Memory resize mode',
  MemorySlots: 'Memory slots',
  /* VM Template schema - VM Group */
  UpdateVmGroup: 'Update VM Group',
  CreateVmGroup: 'Create VM group',
  HostAffined: 'Host Affined',
  HostAntiAffined: 'Host Anti-Affined',
  Affined: 'Affined',
  AntiAffined: 'Anti-Affined',
  Policy: 'Policy',
  VmAffinity: 'VM Affinity',
  RolesAffinity: 'Roles Affinity',
  RoleElasticity: 'Role Elasticity',
  ElasticityPolicy: 'Elasticity Policy',
  ElasticityPolicies: 'Elasticity Policies',
  ScheduledPolicy: 'Scheduled Policy',
  ScheduledPolicies: 'Scheduled Policies',
  AssociateToVMGroup: 'Associate VM to a VM Group',
  /* VM Template schema - placement */
  HostRequirements: 'Host Requirements',
  DatastoreRequirements: 'Datastore Requirements',
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
  Stripping: 'Stripping',
  LoadAware: 'Load-aware',
  Packing: 'Packing',
  /* VM Template schema - Backup */
  BackupVolatileDisksQuestion: 'Backup volatile disks?',
  BackupVolatile: 'Backup volatile',
  FSFreeze: 'FS Freeze',
  Execution: 'Execution',
  HowManyBackupsQuestion: 'How many backups do you want to keep?',
  QEMUAgent: 'QEMU Agent',
  Sequential: 'Sequential',
  Parallel: 'Parallel',
  FSFreezeConcept: `
    How the FS is freeze for running VMs. When
    possible backups are crash consistent`,
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
  RootDevice: 'Root device',
  KernelBootParameters: 'Kernel boot parameters',
  PathBootloader: 'Path to the bootloader executable',
  UniqueIdOfTheVm: 'Unique ID of the VM',
  UniqueIdOfTheVmConcept: `
    It's referenced as machine ID inside the VM.
    Could be used to force ID for licensing purposes`,
  Firmware: 'Firmware',
  FirmwareConcept:
    'This attribute allows to define the type of firmware used to boot the VM',
  FirmwareSecure: 'Firmware secure',
  CpuModel: 'CPU Model',
  CpuFeature: 'CPU Features',
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
  GuestAgentConcept: `Enables the QEMU Guest Agent communication.
    This does not start the Guest Agent inside the VM`,
  VirtioQueues: 'Virtio-scsi Queues',
  VirtioQueuesConcept: `Number of vCPU queues to use in the virtio-scsi controller.
    Leave blank to use the default value`,
  VirtioBlkQueues: 'Virtio-blk Queues',
  VirtioBlkQueuesConcept: `Number of vCPU queues to use in the virtio-blk controller.
    Leave blank to use the default value`,
  IoThreads: 'Iothreads',
  IoThreadsConcept: `
    Number of iothreads for virtio disks.
    By default threads will be assign to disk by round robin algorithm.
    Disk thread id can be forced by disk IOTHREAD attribute`,
  Raw: 'Raw',
  RawData: 'Raw data',
  RawDataConcept:
    'Raw data is used to pass VM information directly to the underlying hypervisor. Anything placed in the data attribute gets passed straight to the hypervisor. Do not add escape characters.',
  RawValidateConcept: `
    Enable or disable validation of the RAW data against the libvirt schema`,
  /* VM Template schema - context */
  Context: 'Context',
  SshPublicKey: 'SSH public key',
  AddUserSshPublicKey: 'Add user SSH public key',
  AddNetworkContextualization: 'Add Network contextualization',
  AddNetworkContextualizationConcept: `
    Add network contextualization parameters. For each NIC defined in
    the NETWORK section, ETH$i_IP, ETH$i_NETWORK... parameters will be
    included in the CONTEXT section and will be available in the Virtual Machine`,
  AddOneGateToken: 'Add OneGate token',
  AddOneGateTokenConcept: `
    Add a file (token.txt) to the context containing the token to push
    custom metrics to the Virtual Machine through OneGate`,
  ReportReadyToOneGate: 'Report Ready to OneGate',
  ReportReadyToOneGateConcept: 'Sends READY=YES to OneGate, useful for OneFlow',
  StartScript: 'Start script',
  StartScriptConcept: `
  Text of the script executed when the machine starts up. It can contain
  shebang in case it is not shell script`,
  EncodeScriptInBase64: 'Encode script in Base64',
  ContextFiles: 'Files Datastores',
  ContextFilesConcept:
    'List of file images to include in context device. Please, search a file image to include in context device.',
  InitScripts: 'Init scripts',
  InitScriptsConcept:
    'The contextualization package executes an init.sh file if it exists. If more than one script file is added, this list contains the scripts to run and their order. Please, add the name of a script and press ENTER.',
  ContextCustomVariables: 'Context Custom Variables',
  ContextCustomVariablesConcept:
    'Context information will be send to the VM at boot time',
  ContextCustomVarErrorExists: 'Context Custom Variable already exists',
  /* VM Template schema - Input/Output */
  InputOrOutput: 'Input / Output',
  Input: 'Input',
  Inputs: 'Inputs',
  PciDevices: 'PCI Devices',
  Profile: 'Profile',
  DeviceName: 'Device name',
  Device: 'Device',
  DeviceTooltip:
    'Select one device of the Device name list to complete this field please.',
  Vendor: 'Vendor',
  VendorTooltip:
    'Select one vendor of the Device name list to complete this field please.',
  Class: 'Class',
  ClassTooltip:
    'Select one class of the Device name list to complete this field please.',
  Video: 'Video',
  VideoType: 'Video device type',
  VideoTypeConcept:
    'Select the driver for the virtual video device, auto will be generated by OpenNebula.',
  IOMMU: 'Enable IOMMU',
  IOMMUConcept:
    'Enable the use of emulated Input/Output Memory Management Unit by the device',
  ATS: 'Enable ATS',
  ATSConcept: 'Enable Address Translation Service support',
  VRAM: 'VRAM (KB)',
  VRAMConcept:
    'Define the amount of VRAM to assign to the video device in KB. Must be greater than or equal to 1024',
  ResolutionConcept: 'Set the default resolution for the video device',
  ResolutionWidth: 'Resolution width',
  ResolutionWidthConcept:
    'Set the default width resolution for the video device',
  ResolutionHeight: 'Resolution height',
  ResolutionHeightConcept:
    'Set the default heigth resolution for the video device',
  /* VM Template schema - Input/Output - graphics */
  Graphics: 'Graphics',
  ListenOnIp: 'Listen on IP',
  ServerPort: 'Server port',
  ServerPortConcept: 'Port for the VNC/SPICE server',
  Keymap: 'Keymap',
  GenerateRandomPassword: 'Generate random password',
  Command: 'Command',
  Bus: 'BUS',
  ConnectionAttributes: '%s connection attributes',
  /* VM Template schema - Input/Output - graphics - Remote Connections Keymaps */
  Arabic: 'Arabic',
  Croatian: 'Croatian',
  Czech: 'Czech',
  Chinese: 'Chinese (China)',
  Danish: 'Danish',
  Dutch: 'Dutch',
  English: 'English',
  EnglishGB: 'English (United Kingdom)',
  EnglishUS: 'English (United States)',
  Estonian: 'Estonian',
  Faroese: 'Faroese',
  Finnish: 'Finnish',
  French: 'French',
  FrenchBe: 'French (Belgium)',
  FrenchCa: 'French (Canada)',
  FrenchBEPO: 'French (BEPO)',
  FrenchSw: 'French (Switzerland)',
  German: 'German',
  GermanSw: 'German (Switzerland)',
  Hungarian: 'Hungarian',
  Icelandic: 'Icelandic',
  Italian: 'Italian',
  Japanese: 'Japanese',
  Latvian: 'Latvian',
  Lithuanian: 'Lithuanian',
  Macedonian: 'Macedonian',
  Norwegian: 'Norwegian',
  Polish: 'Polish',
  Portuguese: 'Portuguese',
  PortugueseBr: 'Portuguese (Brazil)',
  Russian: 'Russian',
  Slavak: 'Slavak',
  Slovenian: 'Slovenian',
  Spanish: 'Spanish',
  SpanishEs: 'Spanish (Spain)',
  SpanishLatam: 'Spanish (Latin American)',
  SpanishCatalan: 'Spanish (Catalan)',
  Swedish: 'Swedish',
  Thai: 'Thai',
  Turkish: 'Turkish',
  /* VM graphs */
  DiskReadBytes: 'Disk read bytes',
  DiskWriteBytes: 'Disk write bytes',
  DiskReadIOPS: 'Disk read IOPS',
  DiskWriteIOPS: 'Disk write IOPS',
  NetRX: 'Net RX',
  NetTX: 'Net TX',
  NetDownloadSpeed: 'Net download speed',
  NetUploadSpeed: 'Net upload speed',
  Graphs: 'Graphs',
  /* VM Template schema - Input/Output - graphics - Remote connections */
  DisplayUpdate: 'Display update',
  /* VM Template schema - NUMA */
  NumaTopology: 'NUMA Topology',
  NumaTopologyConcept:
    'These settings will help you to fine tune the performance of VMs',
  PinPolicy: 'Pin Policy',
  NodeAffinity: 'Numa Affinity',
  NodeAffinityConcept: 'Number of NUMA nodes (node affinity)',
  NumaNodeItem: 'Node #%s',
  NumaNodeTitle: 'Cores & CPUS',
  PinPolicyConcept: 'Virtual CPU pinning preference: %s',
  NumaSocketsConcept: 'Number of sockets or NUMA nodes',
  NumaCoresConcept: 'Number of cores per node',
  NumaNodeMemory: 'Memory',
  NumaCore: 'Core %s',
  NumaNodeCPUItem: 'CPU #%s',
  Threads: 'Threads',
  ThreadsConcept: 'Number of threads per core',
  HugepageNode: 'Hugepage',
  HugepageNodeFree: 'Free',
  HugepageNodePages: 'Pages',
  HugepageNodeSize: 'Size',
  HugepageNodeUsage: 'Usage',
  HugepagesSize: 'Hugepages size',
  HugepagesSizeConcept:
    'Size of hugepages (MB). If not defined no hugepages will be used',
  MemoryAccess: 'Memory Access',
  MemoryAccessConcept: 'Control if the memory is to be mapped: %s',
  VirtualCpuSelected: 'Virtual Cpu selected',
  VirtualCpuSelectedConcept: `
    Number of virtual CPUs. This value is optional, the default
    hypervisor behavior is used, usually one virtual CPU`,
  /* VM Template schema - actions */
  DeleteAllImagesConcept:
    'Enable to delete the template plus any image defined in DISK',
  CopyOf: 'Copy of ',
  PrefixMultipleConcept:
    'Several templates are selected, please choose prefix to name the new copies',
  PrefixSecGroupsMultipleConcept:
    'Several security groups are selected, please choose a prefix to name the new copies Prefix',
  NewTemplateNameConcept: 'New Image name',
  CloneWithImages: 'Clone with images',
  CloneWithImagesConcept: `
    You can also clone any Image referenced inside this Template.
    They will be cloned to a new Image, and made persistent`,
  ShareVmTemplateDescription: `
    The VM Template(s), along with any image referenced by it, will
    be shared with the group's users. Permission changed: GROUP USE`,
  UnshareVmTemplateDescription: `
    The VM Template(s), along with any image referenced by it, will
    be unshared with the group's users. Permission changed: GROUP USE`,

  /* Service Template schema */
  WaitVmsReport:
    'Consider VMs as running only when they report READY status via OneGate',
  ServiceAutoDelete: 'Automatic deletion of service when all VMs terminated',
  /* Service Template schema - general */
  ServiceName: 'Service Name',
  Strategy: 'Strategy',
  ShutdownAction: 'Shutdown action',
  ReadyStatusGate: 'Ready status gate',
  AutomaticDeletion: 'Automatic deletion',
  Role: 'Role',
  Roles: 'Roles',
  Cardinality: 'Cardinality',
  Parents: 'Parents',
  ParentRoles: 'Parent roles',
  AddChartes: 'Add Charters Values Configuration',
  RecoverDelete: 'Recover delete',
  /* Service Template schema - extra */
  Existing: 'Existing',
  Straight: 'Straight',
  /* Service Template - roles */
  RoleDefinition: 'Role Definition',
  RoleDetails: 'Role Details',
  RoleName: 'Role Name',
  RolesMinVms: 'Min VMs',
  RolesMaxVms: 'Max VMs',
  Cooldown: 'Cooldown',
  Adjust: 'Adjust',
  Expression: 'Expression',
  Period: 'Period',
  Percentage: 'Percentage',
  Recurrence: 'Recurrence',
  TimeFormat: 'Time Format',
  TimeExpression: 'Time Expression',
  VMShutdownAction: 'VM Shutdown action',
  Scale: 'Scale',
  RoleEnterName: 'Enter a name for this role',
  RoleSelectNetwork: 'Select a network for this role',
  RoleMinElasticity: 'Minimum number of VMs for elasticity adjustments.',
  RoleMaxElasticity: 'Maximum number of VMs for elasticity adjustments.',
  RoleDurationScale:
    'Duration after a scale operation in seconds. If it is not set, the default set in oneflow-server.conf will be used.',
  RoleAdjustmentType: 'Adjustment type',
  RoleAdjustmentTypePositiveNegative: 'Positive or negative adjustment',
  VMGroupConfiguration: 'VM Group Configuration',
  RoleDefineRoles: 'Define roles and placement constraints.',
  RoleOptimize: 'Optimize performance and fault tolerance.',
  RoleManageApps: 'Manage multi-VM applications efficiently.',
  /* Service Template - configuration */
  RoleConfiguration: 'Role Configuration',
  /* Service Template - schedule actions */
  ServiceSheduleActionCreated: 'Shedule action added to service',

  /* VMGroups - Role definition */
  NewRole: 'New Role',
  VMAffinity: 'VM-VM Affinity',
  HostAffinity: 'Host Affinity',
  AddRoleAffinity: 'Add a role name to assign Host-VM affinity',
  AffinedHosts: 'Affined Hosts',
  NoAffinedHosts:
    'No affined hosts. Assign a set of hosts where the VMs of this rolecan be allocated.',
  NoAffinedHostsConcept:
    'Affined hosts are VMs grouped together on a set of hosts to better modularize deployments and increase performance.',
  AntiAffinedHosts: 'Anti-Affined Hosts',
  NoAntiAffinedHosts:
    'No anti-affined hosts. Assign a set of hosts where the VMs of this role can&apos;t be allocated.',
  NoAntiAffinedHostsConcept:
    'Anti-affined hosts are VMs separated across different hosts to ensure redundancy and fault-tolerance.',
  AffinedRoles: 'Affined Roles',
  AntiAffinedRoles: 'Anti-Affined Roles',

  /* VMGroups - Role affinity */
  AddGroup: 'Add Group',
  AffinedGroups: 'Affined Groups',
  AffinedGroupsDescription:
    'Affined groups improve performance and communication by placing related VM roles together on the same host. Ideal for roles that require high interactivity and shared resources.',
  AffinedGroupsPotentialCase1: 'Database clusters requiring shared storage.',
  AffinedGroupsPotentialCase2:
    'High-performance computing with intensive data exchange.',
  AffinedGroupsPotentialCase3:
    'Real-time processing applications demanding low-latency communication.',
  AntiAffinedGroups: 'Anti-Affined Groups',
  AntiAffinedGroupsDescription:
    'Anti-Affined groups enhance reliability and fault tolerance by distributing VM roles across different hosts. Suitable for roles that need isolation to prevent resource contention and single points of failure.',
  AntiAffinedGroupsPotentialCase1: 'Operational VMs separated from backup VMs.',
  AntiAffinedGroupsPotentialCase2:
    'Diverse application servers to prevent simultaneous failures.',
  AntiAffinedGroupsPotentialCase3:
    'Resource-heavy VMs spread out to avoid performance bottlenecks.',
  PotentialUseCases: 'Potential Use Cases',

  /* Virtual Network schema - network */
  Driver: 'Driver',
  IP: 'IP',
  IPv4Concept: 'First IP in the range in dot notation',
  IPv6Concept: 'First IP6 (full 128 bits) in the range',
  MAC: 'MAC',
  MACConcept: `
    First MAC, if not provided it will be generated
    using the IP and the MAC_PREFIX in oned.conf`,
  NetworkAddress: 'Network address',
  NetworkMask: 'Network mask',
  Gateway: 'Gateway',
  Gateway6: 'IPv6 Gateway',
  GatewayConcept: 'Default gateway for the network',
  Gateway6Concept: 'IPv6 router for this network',
  SearchDomainForDNSResolution: 'Search domains for DNS resolution',
  NetworkMethod: 'Network method',
  NetworkMethod4Concept: 'Sets IPv4 guest conf. method for NIC in this network',
  NetworkMethod6Concept: 'Sets IPv6 guest conf. method for NIC in this network',
  DNS: 'DNS',
  DNSConcept: 'DNS servers, a space separated list of servers',
  AverageBandwidth: 'Average bandwidth',
  PeakBandwidth: 'Peak bandwidth',
  PeakBurst: 'Peak burst',
  InboundAverageBandwidthConcept:
    'Average bitrate for the interface in kilobytes/second for inbound traffic',
  InboundPeakBandwidthConcept:
    'Maximum bitrate for the interface in kilobytes/second for inbound traffic',
  OutboundAverageBandwidthConcept:
    'Average bitrate for the interface in kilobytes/second for outbound traffic',
  OutboundPeakBandwidthConcept:
    'Maximum bitrate for the interface in kilobytes/second for outbound traffic',
  PeakBurstConcept: 'Data that can be transmitted at peak speed in kilobytes',
  Hardware: 'Hardware',
  HardwareModelToEmulate: 'Hardware model to emulate',
  TransmissionQueue: 'Transmission queue',
  OnlySupportedForVirtioDriver: 'Only supported for virtio driver',
  GuestOptions: 'Guest options',
  GuestMTU: 'MTU of the Guest interfaces',
  GuestMTUConcept: 'Sets the MTU for the NICs in this network',
  NetMethod: 'Method',
  NetMethod6: 'IPv6 Method',
  UsedLeases: 'Used leases',
  TotalLeases: 'Total leases',
  TotalClusters: 'Total clusters',
  Completed: 'Completed',
  RecoverNetworkDescription: `
    Recovers a Virtual Network in ERROR state or waiting for a driver operation to complete.
    The recovery may be done by failing, succeeding or retrying the current operation.
    YOU NEED TO MANUALLY CHECK THE VN STATUS, to decide if the operation was successful or not, or if it can be retried.

    States for success/failure recovers: LOCK_CREATE, LOCK_DELETE state.
    States for a retry recover: LOCK_CREATE, LOCK_DELETE state.
    States for delete: Any but READY.`,
  ReservationParent: 'Reservation parent',
  ReservedFromVNetId: 'Reserved from VNET %s',
  GuacamoleConnections: 'Guacamole Connections',
  Lease: 'Lease',
  Leases: 'Leases',
  HoldIP: 'Hold IP',
  Resource: 'Resource',
  /* Virtual Network schema - driver configuration */
  NetworkMode: 'Network mode',
  Bridge: 'Bridge',
  BridgeConcept:
    'This lets you specify the name of the bridge to be created in the hosts.',
  BridgeSwitch: 'Custom name for bridge',
  BridgeSwitchConcept:
    'If enabled, you have to define the name of the bridge. Otherwise, OpenNebula will create the name of the bridge with the "onebr" prefix.',
  PhysicalDevice: 'Physical device',
  PhysicalDeviceConcept:
    'Device name of the physical network card in the host to route traffic to. Example: eth0',
  PhysicalDeviceSwitch: 'Use only private host networking',
  PhysicalDeviceSwitchConcept:
    'If enabled, the Virtual Network will not connect to any physical device and hence the Virtual Machines will be able to communicate only with other Virtual Machines in the same virtual network and in the same host.',
  MacSpoofingFilter: ' MAC spoofing filter',
  IpSpoofingFilter: ' IP spoofing filter',
  MTU: 'MTU of the interface',
  MTUConcept: 'Maximum Transmission Unit',
  VlanId: 'VLAN ID',
  AutomaticVlanId: 'Automatic VLAN ID',
  VxlanMode: 'VXLAN mode',
  VxlanModeConcept: 'Multicast protocol for multi destination BUM traffic',
  VxlanTunnelEndpoint: 'VXLAN Tunnel endpoint',
  VxlanTunnelEndpointConcept: 'Tunnel endpoint communication type',
  VxlanMulticast: 'VXLAN Multicast',
  VxlanMulticastConcept:
    'Base multicast address for each VLAN. The MC address is :vxlan_mc + :vlan_id',
  IpConfiguration: 'IP Configuration',
  IpConfigurationConcept:
    'Options passed to ip cmd on operations specific to this Virtual Network',
  OuterVlanId: 'Outer VLAN ID',
  AutomaticOuterVlanId: 'Automatic Outer VLAN ID',
  InvalidAttribute: 'Invalid attribute',
  /* Virtual Network schema - address range */
  Address: 'Address',
  Addresses: 'Addresses',
  AddressRange: 'Address Range',
  FirstIPv4Address: 'First IPv4 address',
  FirstIPv6Address: 'First IPv6 address',
  FirstMacAddress: 'First MAC address',
  PrefixLength: 'Prefix length',
  PrefixLengthConcept: 'Length of the prefix to configure VM interfaces',
  SLAAC: 'SLAAC',
  IPv6GlobalPrefix: 'IPv6 Global prefix',
  IPv6ULAPrefix: 'IPv6 ULA prefix',
  IPAMDriver: 'IPAM driver',
  InvalidAddress: 'Invalid address',
  InvalidIPv4: 'Invalid IPv4',
  InvalidIPv6: 'Invalid IPv6',
  InvalidMAC: 'Invalid MAC',
  DisabledAddressRangeInForm:
    'Address Ranges need to be managed in the individual Virtual Network panel',
  /* Virtual Network schema - QoS */
  QoS: 'QoS',
  InboundTraffic: 'Inbound traffic',
  OutboundTraffic: 'Outbound traffic',
  SelectQOS: 'Select QoS',
  /* Virtual Network schema - reserve */
  ReservationFromVirtualNetwork: 'Reservation from Virtual Network',
  CanSelectAddressFromAR:
    'You can select the addresses from an specific Address Range',
  NumberOfAddresses: 'Number of addresses',
  AddToNewVirtualNetwork: 'Add to a new Virtual Network',
  AddToExistingReservation: 'Add to an existing Reservation',
  FirstAddress: 'First address',
  IpOrMac: 'IP or MAC',
  MessageQos:
    'These values apply to each VM interface individually, they are not global values for the Virtual Network',

  /* security group schema */
  Security: 'Security',
  TCP: 'TCP',
  UDP: 'UDP',
  ICMP: 'ICMP',
  ICMPV6: 'ICMPv6',
  IPSEC: 'IPsec',
  Outbound: 'Outbound',
  Inbound: 'Inbound',
  Any: 'Any',
  Protocol: 'Protocol',
  IcmpType: 'ICMP Type',
  IcmpTypeV6: 'ICMPv6 Type',
  TotalUpdatedVms: 'Total updated VMs',
  TotalOutdatedVms: 'Total outdated VMs',
  TotalErrorVms: 'Total error VMs',

  /* Host schema */
  IM_MAD: 'IM MAD',
  VM_MAD: 'VM MAD',
  Wilds: 'Wilds',
  Wild: 'Wild',
  Zombies: 'Zombies',
  Numa: 'NUMA',
  NumaLower: 'Numa',
  Hostname: 'Hostname',
  /* Host schema - capacity */
  AllocatedMemory: 'Allocated Memory',
  AllocatedCpu: 'Allocated CPU',
  RealMemory: 'Real Memory',
  RealCpu: 'Real CPU',
  Overcommitment: 'Overcommitment',
  /* Host schema - template */
  ISOLCPUS: 'Isolated CPUS',
  FreeCPU: 'Free CPU',
  UsedCPU: 'Used CPU',
  FreeMemory: 'Free Memory',
  UsedMemory: 'Used memory',
  TemplateToIsolateCpus:
    'Comma separated list of CPU IDs that will be isolated from the NUMA scheduler',

  /* Cluster schema */
  CreateCluster: 'Create Cluster',
  'cluster.create.name': 'Name',
  'cluster.create.general.info': 'Cluster info',

  /* Cluster schema - capacity */
  ReservedMemory: 'Allocated Memory',
  ReservedCpu: 'Allocated CPU',

  /* Marketplace App schema */
  'marketplace.configuration.title': 'Configuration attributes',
  'marketplace.form.create.general.type': 'Storage backend',
  'marketplace.form.create.help.link':
    'See OpenNebula documentation to get more details about marketplaces.',
  'marketplace.general.help.title': 'Marketplace',
  'marketplace.general.help.paragraph.1':
    'OpenNebula Marketplaces provide a simple way to integrate your cloud with popular application/image providers. Think of them as external datastores. A Marketplace can be:',
  'marketplace.general.help.paragraph.2.1':
    'Public: accessible universally by all OpenNebula installations.',
  'marketplace.general.help.paragraph.2.2':
    'Private: local within an organization and specific for a single OpenNebula (a single zone) or shared by a federation (a collection of zones).',
  'marketplace.general.help.paragraph.3':
    'Please, select Name, Description and Storage backend of the Marketplace.',

  'marketplace.form.configuration.one.url': 'Endpoint URL for marketplace',
  'marketplace.form.configuration.one.help.paragraph.1':
    'The OpenNebula Marketplace is a catalog of virtual appliances ready to run in OpenNebula environments available at ',
  'marketplace.form.configuration.one.help.paragraph.1.link':
    'http://marketplace.opennebula.io/appliance',
  'marketplace.form.configuration.one.help.paragraph.2':
    'Please, fill the configuration attributes for Markeplace OpenNebula Systems.',
  'marketplace.form.configuration.one.help.link':
    'See OpenNebula documentation to get more details about OpenNebula Systems marketplaces.',

  'marketplace.form.configuration.http.path': 'Marketapp directory path',
  'marketplace.form.configuration.http.path.tooltip':
    'Absolute directory path to place images (the HTTP server document root) in the Front-end or in the Hosts pointed at by the Storage bridge list',
  'marketplace.form.configuration.http.bridge': 'Storage bridge list',
  'marketplace.form.configuration.http.bridge.tooltip':
    'Space separated list of servers to access the public directory. If not defined, the public directory will be local to the Front-end',
  'marketplace.form.configuration.http.help.paragraph.1':
    'This Marketplace uses a conventional HTTP server to expose the images (Marketplace Appliances) uploaded to the Marketplace. The image will be placed in a specific directory (available on or at least accessible from the Front-end), that must be also served by a dedicated HTTP service.',
  'marketplace.form.configuration.http.help.paragraph.2':
    'Please, fill the configuration attributes for HTTP Marketplace.',
  'marketplace.form.configuration.http.help.link':
    'See OpenNebula documentation to get more details about HTTP marketplaces.',

  'marketplace.form.configuration.s3.accessKey': 'Access Key Id',
  'marketplace.form.configuration.s3.accessKey.tooltip':
    'The access key of the S3 user',
  'marketplace.form.configuration.s3.secretAccessKey': 'Secret Access Key',
  'marketplace.form.configuration.s3.secretAccessKey.tooltip':
    'The secret key of the S3 user',
  'marketplace.form.configuration.s3.bucket': 'S3 bucket to store marketapps',
  'marketplace.form.configuration.s3.bucket.tooltip':
    'The bucket where the files will be stored',
  'marketplace.form.configuration.s3.region': 'Region',
  'marketplace.form.configuration.s3.region.tooltip':
    'The region to connect to. If you are using Ceph-S3 any value here will work',
  'marketplace.form.configuration.s3.aws': 'Use Amazon AWS S3 Service',
  'marketplace.form.configuration.s3.aws.toolkit':
    'Check in case that Amazon AWS S3 Service will be used instead Ceph S3',
  'marketplace.form.configuration.s3.endpoint': 'Endpoint URL for marketplace',
  'marketplace.form.configuration.s3.endpoint.tooltip':
    'This is only required if you are connecting to a service other than Amazon AWS S3. Preferably don’t use an endpoint that includes the bucket as the leading part of the host’s URL',
  'marketplace.form.configuration.s3.totalMB': 'Total Marketplace size in MB',
  'marketplace.form.configuration.s3.totalMB.tooltip':
    'This parameter defines the total size of the Marketplace in MB. It defaults to 1048576 (MB).',
  'marketplace.form.configuration.s3.readLength': 'Read block length in MB',
  'marketplace.form.configuration.s3.readLength.tooltip':
    'Split the file into chunks of this size in MB, never user a value larger than 100. Defaults to 32 (MB).',
  'marketplace.form.configuration.s3.help.paragraph.1':
    'This Marketplace uses an S3 API-capable service as the Back-end. This means Marketplace Appliances will be stored in the official AWS S3 service , or in services that implement that API, like Ceph Object Gateway S3.',
  'marketplace.form.configuration.s3.help.paragraph.2':
    'Please, fill the configuration attributes for S3 Marketplace.',
  'marketplace.form.configuration.s3.help.link':
    'See OpenNebula documentation to get more details about S3 marketplaces.',

  'marketplace.form.configuration.linuxcontainers.imageSize':
    'Size in MB for the image holding the rootfs',
  'marketplace.form.configuration.linuxcontainers.filesystem':
    'Filesystem used for the image',
  'marketplace.form.configuration.linuxcontainers.format':
    'Image block file format',
  'marketplace.form.configuration.linuxcontainers.skip_untested':
    'Include only apps with support for context',
  'marketplace.form.configuration.linuxcontainers.cpu': 'VMTemplate CPU',
  'marketplace.form.configuration.linuxcontainers.vcpu': 'VMTemplate VCPU',
  'marketplace.form.configuration.linuxcontainers.memory': 'VMTemplate MEMORY',
  'marketplace.form.configuration.linuxcontainers.privileged':
    'Security mode of the Linux Container',
  'marketplace.form.configuration.linuxcontainers.help.paragraph.1.1': 'The ',
  'marketplace.form.configuration.linuxcontainers.help.paragraph.1.2':
    'Linux Containers image server ',
  'marketplace.form.configuration.linuxcontainers.help.paragraph.1.3':
    'hosts a public image server with container images for LXC. OpenNebula’s Linux Containers marketplace enable users to easily download, contextualize and add Linux containers images to an OpenNebula datastore.',
  'marketplace.form.configuration.linuxcontainers.help.paragraph.1.link':
    'https://images.linuxcontainers.org/',
  'marketplace.form.configuration.linuxcontainers.help.paragraph.2':
    'Please, fill the configuration attributes for Linux Containers Marketplace.',
  'marketplace.form.configuration.linuxcontainers.help.link':
    'See OpenNebula documentation to get more details about Linux Containers marketplaces.',

  'marketplace.types.one': 'OpenNebula Systems',
  'marketplace.types.http': 'HTTP',
  'marketplace.types.s3': 'Amazon S3',
  'marketplace.types.dockerhub': 'DockerHub',
  'marketplace.types.dockerRegistry': 'Docker Registry',
  'marketplace.types.linuxcontainers': 'Linux Containers',

  'marketplace.form.configuration.url': 'Base URL of the Marketplace',

  /* Marketplace App - general */
  MarketplaceApp: 'Marketplace app',
  RegisteredAt: 'Registered %s',
  LastBackupTime: 'Last Backup Time: %s',
  LastBackupTimeInfo: 'Last Backup Time',
  LastBackupDuration: 'Last Backup Duration',
  Version: 'Version',
  AppTemplate: 'App Template',
  TemplatesForTheApp: 'Templates for the App',
  TemplatesForTheAppConcept: `
    VM Template to be created. A DISK element pointing to the App Image will be
    automatically added when the App is exported`,
  ImportIntoDatastore: 'Import into Datastore',
  DownloadAppToOpenNebula: 'Download App to OpenNebula',
  DownloadApp: 'Download App',
  DownloadDefaultImage: 'Download Default Image',
  ExportAppNameConcept:
    'Name that the resource will get for description purposes',
  ExportTemplateNameConcept: `
    The following template will be created in OpenNebula
    and the previous images will be referenced in the disks`,
  ExportAssociateApp: 'Export associated VM templates/images',
  ImportAssociateApp: 'Import associated VM templates/images',
  SelectResourceToCreateTheApp: 'Select the resource to create the App',
  SelectImageToCreateTheApp: 'Select the Image to create the App',
  SelectBackupImage: 'Select backup image',
  SelectVmToCreateTheApp: 'Select the VM to create the App',
  SelectVmTemplateToCreateTheApp: 'Select the VM Template to create the App',

  /* Image schema */
  /* Image - general */
  Limit: 'Limit',
  BasePath: 'Base path',
  FileSystemType: 'Filesystem type',
  Persistent: 'Persistent',
  NonPersistent: 'Non Persistent',
  RunningVMs: 'Running VMs',
  RunningVMsLower: 'Running Vms',
  Rvms: 'Rvms',
  /* Disk - general */
  DiskType: 'Disk type',
  SizeOnInstantiate: 'Size on instantiate',
  SizeOnInstantiateConcept: `
    The size of the disk will be modified to match
    this size when the template is instantiated`,
  TargetDevice: 'Target device',
  TargetDeviceConcept: `
    Device to map image disk.
    If set, it will overwrite the default device mapping`,
  ReadOnly: 'Read-only',
  BusAdapterController: 'Bus adapter controller',
  DiskProvisioningType: 'Disk provisioning type',
  Cache: 'Cache',
  IoPolicy: 'IO Policy',
  Discard: 'Discard',
  IopsSize: 'Size of IOPS per second',
  ThrottlingBytes: 'Throttling (Bytes/s)',
  ThrottlingIOPS: 'Throttling (IOPS)',
  TotalValue: 'Total value',
  TotalMaximum: 'Total maximum',
  TotalMaximumLength: 'Total maximum length',
  ReadValue: 'Read value',
  ReadMaximum: 'Read maximum',
  ReadMaximumLength: 'Read maximum length',
  WriteValue: 'Write value',
  WriteMaximum: 'Write maximum',
  WriteMaximumLength: 'Write maximum length',
  Cbt: 'CBT',
  SnapshotFrequency: 'Snapshot Frequency in seconds',
  IoThreadId: 'IOTHREAD id',
  IoThreadIdConcept: `
    Iothread id used by this disk. Default is round robin.
    Can be used only if IOTHREADS > 0. If this input is disabled
    please first configure IOTHREADS value on OS & CPU -> Features`,
  ImageLocation: 'Image Location',

  /* Provision schema */
  /* Provision - general */
  ProvisionId: 'Provision ID',

  /* User inputs */
  AuthDriver: 'Auth Driver',
  PasswordHash: 'Password Hash',
  TokenPasswordHash: 'Token Password Hash',
  UserInputs: 'User Inputs',
  UserInputsConcept: `
    These attributes must be provided by the user when a new VM is instantiated.
    They will be included in the VM context`,
  Fixed: 'Fixed',
  Range: 'Range',
  MinRange: 'Min range',
  MaxRange: 'Max range',
  RangeFloat: 'Range float',
  List: 'List',
  ListMultiple: 'List multiple',
  Boolean: 'Boolean',
  Number: 'Number',
  NumberFloat: 'Number float',
  Text: 'Text',
  Text64: 'Text64',
  AnyValue: 'Any value',
  Value: 'Value',
  Options: 'Options',
  UIOptionsConcept:
    'Comma-separated list of options for the drop-down select input',
  Min: 'Min',
  Max: 'Max',
  DefaultValue: 'Default value',
  Mandatory: 'Mandatory',
  PressKeysToAddAValue: 'Press any of the following keys to add a value: %s',
  /** Security Groups */
  Start: 'Start',
  Rules: 'Rules',
  PortRange: 'Port Range',
  FirstIPIPv6Address: 'First IP/IPv6 address',
  TargetNetwork: 'Target Network',
  AnyNetwork: 'Any Network',
  ManualNetwork: 'Manual Network',
  OpennebulaVirtualNetwork: 'OpenNebula Virtual Network',
  SelectNewNetwork: 'Please select a network from the list',
  MessageAddSecGroupDefault:
    'The default Security Group 0 is automatically added to new Virtual Networks',
  NotVmsCurrentySecGroups:
    'There are currently no VMs associated with this Security Group',
  CommitMessageSecGroups: `
    Please note: each time the rules are edited, the commit operation is done automatically.
    This action will force the propagation of security group changes to VMs. 
    The operation takes time to iterate over all VMs in the security group, 
    the progress can be checked in the "VMs" panel.`,
  RecoverCommitMessageSecGroups:
    'If set the commit operation will only operate on outdated and error VMs',
  /** Image */
  NotVmsCurrently: 'There are currently no VMs associated with this image',
  NotSnapshotCurrently:
    'There are currently no snapshots associated with this image',

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
  'validation.array.min': 'Must have at least %s item(s) to act as a default',
  'validation.array.max': 'Must have less than or equal to %s item(s)',
  'validation.array.length': 'Must have %s item(s)',

  /* system - groups */
  'groups.users.total': 'Total users: %1$s',
  'groups.name': 'Group name',
  'groups.adminUser.title': 'Create an administrator user',
  'groups.views.title': 'Views',
  'groups.general.info':
    'New groups are automatically added to the default VDC',
  'groups.system.defaultImagePersistentNew.title':
    'Make new images persistent by default',
  'groups.system.defaultImagePersistentNew.tooltip':
    'Control the default value for the PERSISTENT attribute on image creation (oneimage create).',
  'groups.system.defaultImagePersistent.title':
    'Make save-as and clone images persistent by default',
  'groups.system.defaultImagePersistent.tooltip':
    'Control the default value for the PERSISTENT attribute on image creation (oneimage clone, onevm disk-saveas). If blank images will inherit the persistent attribute from the base image.',
  'groups.permissions.resources': 'More resources',
  'groups.permissions.view.section': 'Permissions - View',
  'groups.permissions.view.section.concept':
    "This will create new ACL Rules to define which virtual resources this group's users will be able to view.",
  'groups.permissions.view.check':
    'Allow users to view the VMs and Services of other users in the same group',
  'groups.permissions.view.check.concept':
    'An ACL Rule will be created to give users in this group access to all the resources in the same group.',
  'groups.permissions.create.section': 'Permissions - Create',
  'groups.permissions.create.section.concept':
    "This will create new ACL Rules to define which virtual resources this group's users will be able to create.",
  'groups.permissions.create.documents': 'Documents',
  'groups.permissions.create.documents.concept':
    'Documents are a special tool used for general purposes, mainly by OneFlow. If you want to enable users of this group to use service composition via OneFlow, let it checked.',
  'groups.permissions.help.title': 'Permissions of a group',
  'groups.permissions.help.paragraph.1':
    'Select the permissions that the users who belong to the group will have.',
  'groups.permissions.help.paragraph.2':
    'On "Permissions - Create" select if the users could or not create the resources that are select.',
  'groups.permissions.help.paragraph.3':
    'On "Permissions - View" select if the users could or not view resources that other users of the group have created.',
  'groups.permissions.help.paragraph.link':
    'See OpenNebula documentation to get more details about groups and permissions.',
  'groups.views.group.section': 'Views - Groups',
  'groups.views.group.tooltip':
    'Select the default view and the views that any user on the group could use',
  'groups.views.admin.section': 'Views - Admin',
  'groups.views.admin.tooltip':
    'Select the default view and the views that only the admin users of the group could use',
  'groups.views.default': 'Default view',
  'groups.views.help.title': 'Views of a group',
  'groups.views.help.paragraph.1':
    'Select the views that the users who belong to the group will have.',
  'groups.views.help.paragraph.2':
    'On "Views - Groups" select the views and the default view for a regular user of the group.',
  'groups.views.help.paragraph.3':
    'On "Views - Admin" select the views and the default view for an admin user of the group.',
  'groups.views.help.paragraph.link':
    'See OpenNebula documentation to get more details about views on Fireedge Sunstone.',
  'groups.actions.edit.admins': 'Edit administrators',
  'groups.actions.edit.admins.form': 'Select the administrators',
  'groups.actions.edit.admins.success': 'Administrators updated',

  'groups.view.admin.name': 'Admin view',
  'groups.view.admin.description': 'View used by admin users',
  'groups.view.user.name': 'User view',
  'groups.view.user.description': 'View used by regular users',
  'groups.view.cloud.name': 'Cloud view',
  'groups.view.cloud.description': 'View used by cloud users',
  'groups.view.groupadmin.name': 'Admin group view',
  'groups.view.groupadmin.description':
    'View used by the admin users of the group',

  /* Showback */
  'showback.title': 'Showback',
  'showback.button.getShowback': 'Get showback',
  'showback.button.calculateShowback': 'Calculate showback',
  'showback.button.help.paragraph.1':
    'Generate showback data to the interval selected in start and end date. After generate the showback data, you can access to the reports on the user or group Showback details. ',

  /* system - acls */
  'acls.table.actions.create.string': 'Create from string',

  'acls.table.types.icons': 'Icons',
  'acls.table.types.names': 'Names',
  'acls.table.types.cli': 'CLI',
  'acls.table.types.resources': 'Resources',
  'acls.table.types.rule': 'Rule',
  'acls.table.types.readablerule': 'Readable Rule',
  'acls.table.types.button': 'Table view',
  'acls.table.types.title': 'Change to view:',

  'acls.table.card.rule.user.tooltip': 'Rule applies to user: %1$s',
  'acls.table.card.rule.group.tooltip': 'Rule applies to group: %1$s',
  'acls.table.card.rule.cluster.tooltip': 'Rule applies to cluster: %1$s',
  'acls.table.card.rule.all.tooltip': 'Rule applies to all',
  'acls.table.card.rule.zone.tooltip': 'Rule applies to zone: %1$s',
  'acls.table.card.rule.zone.tooltip.all': 'Rule applies to all zones',
  'acls.table.card.resources.individual.tooltip':
    'Resources with identifier: %1$s',
  'acls.table.card.resources.group.tooltip': 'Resources owned by group: %1$s',
  'acls.table.card.resources.cluster.tooltip':
    'Resources owned by cluster: %1$s',
  'acls.table.card.resources.all.tooltip': 'Resources owned by all',

  'acls.table.filter.string': 'String rule',
  'acls.table.filter.resources.user.id': 'Resource identifier id',
  'acls.table.filter.resources.user.name': 'Resource identifier name',
  'acls.table.filter.resources.user.type': 'Resource identifier type',
  'acls.table.filter.user.id': 'User identifier id',
  'acls.table.filter.user.name': 'User identifier name',
  'acls.table.filter.user.type': 'User identifier type',
  'acls.table.filter.zone.id': 'Zone identifier id',
  'acls.table.filter.zone.name': 'Zone identifier name',
  'acls.table.filter.zone.type': 'Zone identifier type',

  'acls.form.create.user.title': 'Users',
  'acls.form.create.user.info':
    'Select whom the rule will apply. Could be an individual user, a group of users or all users.',
  'acls.form.create.user.individual': 'Select which user to apply the rule to',
  'acls.form.create.user.group': 'Select which group to apply the rule to',

  'acls.form.create.resources.title': 'Resources',
  'acls.form.create.resources.info': 'Select affected resources by the rule.',
  'acls.form.create.resources.vm': 'Virtual Machine',
  'acls.form.create.resources.vmtemplate': 'Virtual Machine Template',
  'acls.form.create.resources.vnettemplate': 'Virtual Network Template',

  'acls.form.create.resourcesUser.title': 'Resource identifier',
  'acls.form.create.resourcesUser.info':
    'Select resource owners. Could be an individual user, a group of users, a cluster or all users.',
  'acls.form.create.resourcesUser.individual':
    'Enter the number of the identifier',
  'acls.form.create.resourcesUser.group':
    'Select which group is the owner of the resources',
  'acls.form.create.resourcesUser.cluster':
    'Select which cluster is the owner of the resources',
  Identifier: 'Identifier',

  'acls.form.create.rights.title': 'Rights',
  'acls.form.create.rights.info':
    'Select the allowed operations that this rule will enable.',

  'acls.form.create.zone.title': 'Zone',
  'acls.form.create.zone.info':
    'Select the zone where the rule will apply. Optional unless OpenNebula is configured in a federation.',
  'acls.form.create.zone.zone': 'Select which zone the rule will apply.',

  'acls.form.create.summary.title': 'Summary',
  'acls.form.create.summary.info.rule': 'Rule that will be created: ',
  'acls.form.create.summary.info.translation': 'That means: ',

  'acls.form.create.stringEditor.title': 'String ACL rule',
  'acls.form.create.stringEditor.info':
    'Enter the string rule that will be created. Remember that a rule it is composed by four different components:',
  'acls.form.create.stringEditor.info.user.title': 'User: ',
  'acls.form.create.stringEditor.info.user.info':
    'Composed by an ID definition (#<id> for individual user, @<id> for groups and * for all).',
  'acls.form.create.stringEditor.info.resource.title': 'Resources: ',
  'acls.form.create.stringEditor.info.resource.info':
    "Composed by a list of '+' separated resource types, '/' and an ID definition (#<id> for individual resource, @<id> for groups, %<id> for clusters and * for all).",
  'acls.form.create.stringEditor.info.rights.title': 'Rights: ',
  'acls.form.create.stringEditor.info.rights.info':
    "Is a list of operations (USE, MANAGE, ADMIN and CREATE) separated by the '+' character.",
  'acls.form.create.stringEditor.info.zone.title': 'Zone: ',
  'acls.form.create.stringEditor.info.zone.info':
    'is an ID definition (#<id> for a zone and * for all) of the zones where the rule applies. This last part is optional, and can be ignored unless OpenNebula is configured in a federation.',
  'acls.form.create.stringEditor.info.more':
    'See OpenNebula documentation to get more details ',
  'acls.form.create.stringEditor.info.more.link': 'about ACL rules.',

  'acls.translate.rule': 'Rule',
  'acls.translate.user.id': 'allow user with id',
  'acls.translate.user.group': 'allows users in the group',
  'acls.translate.user.all': 'allows all users',
  'acls.translate.rights': 'the right to perform',
  'acls.translate.and': 'and',
  'acls.translate.operation': 'operation',
  'acls.translate.operations': 'operations',
  'acls.translate.over': 'over',
  'acls.translate.overall': 'over all',
  'acls.translate.resource.id': 'with identifier',
  'acls.translate.resource.group': 'in the group',
  'acls.translate.resource.cluster': 'in the cluster',
  'acls.translate.zone.id': 'in the zone',
  'acls.translate.zone.all': 'in all zones',
  'acls.translate.error': 'ACL rule is NOT valid',

  'acls.form.delete.rule': 'Rule with id',
  'acls.form.delete.means': 'that means',

  Rights: 'Rights',

  StartDate: 'Start Date',
  EndDate: 'EndDate',

  /* NIC - card */
  'nic.card.automatic': 'Automatically selected',
  'nic.card.management': 'Management interface',
  'nic.card.rdp': 'Remote Desktop Protocol',
  'nic.card.ssh': 'Secure Shell Protocol',

  /* Data grid translations */
  ColumnMenuLabel: 'Menu',
  ColumnMenuShowColumns: 'Show columns',
  ColumnMenuManageColumns: 'Manage columns',
  ColumnMenuFilter: 'Filter',
  ColumnMenuHideColumn: 'Hide column',
  ColumnMenuUnsort: 'Unsort',
  ColumnMenuSortAsc: 'Sort by ASC',
  ColumnMenuSortDesc: 'Sort by DESC',
  ColumnHeaderSortIconLabel: 'Sort',

  /* Success messages */
  SuccessConnectionEstablished: 'Connection established',
  SuccessDownloadDefaultImage: 'Downloaded default image',
  SuccessQuotaUpdated: 'Quota updated successfully for ID %s',
  SuccessRoleActionCompleted: 'Action %s completed on role: %s',
  SuccessPasswordUpdated: 'Password updated successfully!',
  SuccessAuthDriver: 'Authentication driver updated successfully!',
  SuccessPublicSSHKeyUpdated: 'Public SSH Key updated successfully!',
  SuccessPrivateSSHKeyUpdated: 'Private SSH Key updated successfully!',
  SuccessPassphraseSSHKeyUpdated: 'SSH Key Passphrase updated successfully!',
  SuccessACLCreated: 'ACL rule created - #%s',
  SuccessBackupJobCreated: 'BackupJob created - #%s',
  SuccessClusterCreated: 'Cluster created - #%s',
  SuccessClusterUpdated: 'Cluster updated - #%s',
  SuccessDatastoreCreated: 'Datastore created - #%s',
  SuccessFileCreated: 'File created - #%s',
  SuccessGroupCreated: 'Group created - #%s',
  SuccessGroupUpdated: 'Group updated - #%s',
  SuccessHostCreated: 'Host created - #%s',
  SuccessImageCreated: 'Image created - #%s',
  SuccessMarketplaceAppCreated: 'Marketplace App created: %s',
  SuccessMarketplaceCreated: 'Marketplace created - #%s',
  SuccessMarketplaceUpdated: 'Marketplace updated - #%s',
  SuccessProviderCreated: 'Provider created - #%s',
  SuccessProviderUpdated: 'Provider updated - #%s',
  SuccessProviderDeleted: 'Provider deleted - #%s',
  SuccessDatastoreDeleted: 'Datastore deleted - #%s',
  SuccessIPAdded: 'IP added %s',
  SuccessNetworkDeleted: 'Network deleted - #%s',
  SuccessSecurityGroupCreated: 'Security Group created - #%s',
  SuccessSecurityGroupUpdated: 'Security Group updated - #%s %s',
  SuccessServiceTemplateCreated: 'Service Template created - #%s %s',
  SuccessServiceTemplateUpdated: 'Service Template updated - #%s %s',
  SuccessServiceTemplateInitiated: 'Service Template initiated - #%s',
  SuccessShowbackCalculated: 'Showback calculated',
  SuccessUserCreated: 'User created - #%s',
  SuccessVDCCreated: 'VDC created - #%s',
  SuccessVDCUpdated: 'VDC updated - #%s %s',
  SuccessVnetCreated: 'Virtual Network created - #%s',
  SuccessVnetUpdated: 'Virtual Network updated - #%s %s',
  SuccessVrTemplateCreated: 'VR Template created - #%s',
  SuccessVrTemplateUpdated: 'VR Template updated - #%s %s',
  SuccessVMGroupCreated: 'VM group created - #%s',
  SuccessVMGroupUpdated: 'VM group updated - #%s %s',
  SuccessVMTemplateCreated: 'VM Template created - #%s',
  SuccessVMTemplateUpdated: 'VM Template updated - #%s %s',
  SuccessVNetTemplateCreated: 'Virtual Network Template created - #%s',
  SuccessVNetTemplateUpdated: 'Virtual Network Template updated - #%s %s',

  /* Error messages */
  ErrorExportingData: 'Error exporting data to %s : %s',
  ErrorVmTemplateFetching: 'Error fetching VM templates data: %s',
  ErrorHostFetching: 'Error fetching host data: %s',
  ErrorUserInputAutocompleteFetch: 'Failed to fetch official suggestions',
  ErrorQuotaUpdated: 'Error updating quota for ID %s: %s',
  ErrorQuotaNoValueSpecified: 'No value specified for Resource ID %s',
  ErrorPasswordUpdated: 'Error updating password: %s',
  ErrorAuthDriverUpdated: 'Error updating authentication driver: %s',
  ErrorPublicSSHKeyUpdated: 'Error updating Public SSH Key: %s',
  ErrorPrivateSSHKeyUpdated: 'Error updating Private SSH Key: %s',
  ErrorPassphraseSSHKeyUpdated: 'Error updating SSH Key Passphrase: %s',
  ErrorVmGroupsFetch: 'Failed to fetch vm groups, displaying all VMs',
  ErrorACLCreated: 'Error creating ACL rule',
  ErrorClusterOperation: 'Error performing operation on cluster',
  ErrorGroupCreated: 'Error creating group',
  ErrorMarketplaceCreated: 'Error creating marketplace',
  ErrorProviderTemplateSelected:
    'The template selected has a bad format. Ask your cloud administrator',
  ErrorShowbackCalculated: 'Error calculating showback: %s',
  ErrorSupportCredentials: 'Error with support credentials',
  ErrorVMGroupFetch: 'Failed to fetch VM Group data: %s',
  ErrorServiceActionRole: 'Action %s failed on role: %s. Error: %s',

  /* Info messages */
  InfoDisconnected: 'Disconnected',
  InfoEnableOpenNebulaMarketplace: 'Enabled OpenNebula Public marketplace',
  InfoServiceActionRole: 'Starting %s action on role: %s',
  InfoProvisionCreate: 'Creating provision',
  InfoProvisionConfigure: 'Configuring provision - ID: %s',
  InfoProvisionDelete: 'Deleting provision - ID: %s',
  InfoProvisionAddHost: 'Adding %s Host%s',
  InfoProvisionConfigureHost: 'Configuring host - ID: %s',
  InfoProvisionDeleteHost: 'Deleting Host - ID: %s',
  InfoVRTemplateInstantiated: 'VR Template instantiated %s',
  InfoVMTemplateInstantiated: 'VM Template instantiated x%s - %s',
  InfoVNTemplateInstantiated: 'VN Template instantiated - %s',
}
