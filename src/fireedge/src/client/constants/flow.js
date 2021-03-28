import * as STATES from 'client/constants/states'
import COLOR from 'client/constants/color'

export const APPLICATION_STATES = [
  {
    name: STATES.PENDING,
    color: COLOR.info.main,
    meaning: `
      The Application starts in this state, and will stay in
      it until the LCM decides to deploy it`
  },
  {
    name: STATES.DEPLOYING,
    color: COLOR.info.main,
    meaning: 'Some Tiers are being deployed'
  },
  {
    name: STATES.RUNNING,
    color: COLOR.success.main,
    meaning: 'All Tiers are deployed successfully'
  },
  {
    name: STATES.UNDEPLOYING,
    color: COLOR.error.light,
    meaning: 'Some Tiers are being undeployed'
  },
  {
    name: STATES.WARNING,
    color: COLOR.error.light,
    meaning: 'A VM was found in a failure state'
  },
  {
    name: STATES.DONE,
    color: COLOR.error.dark,
    meaning: `
      The Applications will stay in this state after
      a successful undeployment. It can be deleted`
  },
  {
    name: STATES.FAILED_UNDEPLOYING,
    color: COLOR.error.dark,
    meaning: 'An error occurred while undeploying the Application'
  },
  {
    name: STATES.FAILED_DEPLOYING,
    color: COLOR.error.dark,
    meaning: 'An error occurred while deploying the Application'
  },
  {
    name: STATES.SCALING,
    color: COLOR.error.light,
    meaning: 'A Tier is scaling up or down'
  },
  {
    name: STATES.FAILED_SCALING,
    color: COLOR.error.dark,
    meaning: 'An error occurred while scaling the Application'
  },
  {
    name: STATES.COOLDOWN,
    color: COLOR.error.light,
    meaning: 'A Tier is in the cooldown period after a scaling operation'
  }
]

export const TIER_STATES = [
  {
    name: STATES.PENDING,
    color: '',
    meaning: 'The Tier is waiting to be deployed'
  },
  {
    name: STATES.DEPLOYING,
    color: '',
    meaning: `
      The VMs are being created, and will be
      monitored until all of them are running`
  },
  {
    name: STATES.RUNNING,
    color: '',
    meaning: 'All the VMs are running'
  },
  {
    name: STATES.WARNING,
    color: '',
    meaning: 'A VM was found in a failure state'
  },
  {
    name: STATES.SCALING,
    color: '',
    meaning: 'The Tier is waiting for VMs to be deployed or to be shutdown'
  },
  {
    name: STATES.COOLDOWN,
    color: '',
    meaning: 'The Tier is in the cooldown period after a scaling operation'
  },
  {
    name: STATES.UNDEPLOYING,
    color: '',
    meaning: `
      The VMs are being shutdown. The Tier will stay in
      this state until all VMs are done`
  },
  {
    name: STATES.DONE,
    color: '',
    meaning: 'All the VMs are done'
  },
  {
    name: STATES.FAILED_DEPLOYING,
    color: '',
    meaning: 'An error occurred while deploying the VMs'
  },
  {
    name: STATES.FAILED_UNDEPLOYING,
    color: '',
    meaning: 'An error occurred while undeploying the VMs'
  },
  {
    name: STATES.FAILED_SCALING,
    color: '',
    meaning: 'An error occurred while scaling the Tier'
  }
]
