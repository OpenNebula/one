export const PENDING = 'PENDING'
export const DEPLOYING = 'DEPLOYING'
export const RUNNING = 'RUNNING'
export const UNDEPLOYING = 'UNDEPLOYING'
export const WARNING = 'WARNING'
export const DONE = 'DONE'
export const FAILED_UNDEPLOYING = 'FAILED_UNDEPLOYING'
export const FAILED_DEPLOYING = 'FAILED_DEPLOYING'
export const SCALING = 'SCALING'
export const FAILED_SCALING = 'FAILED_SCALING'
export const COOLDOWN = 'COOLDOWN'

export const APPLICATION_STATES = [
  {
    name: PENDING,
    color: '#4DBBD3',
    meaning: `
      The Application starts in this state, and will stay in
      it until the LCM decides to deploy it`
  },
  {
    name: DEPLOYING,
    color: '#4DBBD3',
    meaning: 'Some Tiers are being deployed'
  },
  {
    name: RUNNING,
    color: '#3adb76',
    meaning: 'All Tiers are deployed successfully'
  },
  {
    name: UNDEPLOYING,
    color: '#ffa07a',
    meaning: 'Some Tiers are being undeployed'
  },
  {
    name: WARNING,
    color: '#ffa07a',
    meaning: 'A VM was found in a failure state'
  },
  {
    name: DONE,
    color: '#ec5840',
    meaning: `
      The Applications will stay in this state after
      a successful undeployment. It can be deleted`
  },
  {
    name: FAILED_UNDEPLOYING,
    color: '#ec5840',
    meaning: 'An error occurred while undeploying the Application'
  },
  {
    name: FAILED_DEPLOYING,
    color: '#ec5840',
    meaning: 'An error occurred while deploying the Application'
  },
  {
    name: SCALING,
    color: '#ffa07a',
    meaning: 'A Tier is scaling up or down'
  },
  {
    name: FAILED_SCALING,
    color: '#ec5840',
    meaning: 'An error occurred while scaling the Application'
  },
  {
    name: COOLDOWN,
    color: '#ffa07a',
    meaning: 'A Tier is in the cooldown period after a scaling operation'
  }
]

export const TIER_STATES = [
  {
    name: PENDING,
    color: '',
    meaning: 'The Tier is waiting to be deployed'
  },
  {
    name: DEPLOYING,
    color: '',
    meaning: `
      The VMs are being created, and will be
      monitored until all of them are running`
  },
  {
    name: RUNNING,
    color: '',
    meaning: 'All the VMs are running'
  },
  {
    name: WARNING,
    color: '',
    meaning: 'A VM was found in a failure state'
  },
  {
    name: SCALING,
    color: '',
    meaning: 'The Tier is waiting for VMs to be deployed or to be shutdown'
  },
  {
    name: COOLDOWN,
    color: '',
    meaning: 'The Tier is in the cooldown period after a scaling operation'
  },
  {
    name: UNDEPLOYING,
    color: '',
    meaning: `
      The VMs are being shutdown. The Tier will stay in
      this state until all VMs are done`
  },
  {
    name: DONE,
    color: '',
    meaning: 'All the VMs are done'
  },
  {
    name: FAILED_DEPLOYING,
    color: '',
    meaning: 'An error occurred while deploying the VMs'
  },
  {
    name: FAILED_UNDEPLOYING,
    color: '',
    meaning: 'An error occurred while undeploying the VMs'
  },
  {
    name: FAILED_SCALING,
    color: '',
    meaning: 'An error occurred while scaling the Tier'
  }
]
