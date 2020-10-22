const PENDING = 'PENDING'
const DEPLOYING = 'DEPLOYING'
const RUNNING = 'RUNNING'
const WARNING = 'WARNING'
const SCALING = 'SCALING'
const COOLDOWN = 'COOLDOWN'
const UNDEPLOYING = 'UNDEPLOYING'
const DONE = 'DONE'
const FAILED_DEPLOYING = 'FAILED_DEPLOYING'
const FAILED_UNDEPLOYING = 'FAILED_UNDEPLOYING'
const FAILED_SCALING = 'FAILED_SCALING'

export const APPLICATION_STATES = [
  {
    name: PENDING,
    color: '',
    meaning: `
      The Application starts in this state, and will stay in
      it until the LCM decides to deploy it`
  },
  {
    name: DEPLOYING,
    color: '',
    meaning: 'Some Tiers are being deployed'
  },
  {
    name: RUNNING,
    color: '',
    meaning: 'All Tiers are deployed successfully'
  },
  {
    name: WARNING,
    color: '',
    meaning: 'A VM was found in a failure state'
  },
  {
    name: SCALING,
    color: '',
    meaning: 'A Tier is scaling up or down'
  },
  {
    name: COOLDOWN,
    color: '',
    meaning: 'A Tier is in the cooldown period after a scaling operation'
  },
  {
    name: UNDEPLOYING,
    color: '',
    meaning: 'Some Tiers are being undeployed'
  },
  {
    name: DONE,
    color: '',
    meaning: `
      The Applications will stay in this state after
      a successful undeployment. It can be deleted`
  },
  {
    name: FAILED_DEPLOYING,
    color: '',
    meaning: 'An error occurred while deploying the Application'
  },
  {
    name: FAILED_UNDEPLOYING,
    color: '',
    meaning: 'An error occurred while undeploying the Application'
  },
  {
    name: FAILED_SCALING,
    color: '',
    meaning: 'An error occurred while scaling the Application'
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
    name: 'SCALING',
    color: '',
    meaning: 'The Tier is waiting for VMs to be deployed or to be shutdown'
  },
  {
    name: 'COOLDOWN',
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
    name: 'FAILED UNDEPLOYING',
    color: '',
    meaning: 'An error occurred while undeploying the VMs'
  },
  {
    name: FAILED_SCALING,
    color: '',
    meaning: 'An error occurred while scaling the Tier'
  }
]
