import * as STATES from 'client/constants/states'
import COLOR from 'client/constants/color'

export const PROVISIONS_STATES = [
  {
    name: STATES.PENDING,
    color: COLOR.warning.main,
    meaning: ''
  },
  {
    name: STATES.DEPLOYING,
    color: COLOR.info.main,
    meaning: ''
  },
  {
    name: STATES.CONFIGURING,
    color: COLOR.info.main,
    meaning: ''
  },
  {
    name: STATES.RUNNING,
    color: COLOR.success.main,
    meaning: ''
  },
  {
    name: STATES.ERROR,
    color: COLOR.error.dark,
    meaning: ''
  },
  {
    name: STATES.DELETING,
    color: COLOR.error.light,
    meaning: ''
  }
]

export const PROVIDERS_TYPES = [
  {
    name: 'aws',
    color: '#ef931f'
  },
  {
    name: 'packet',
    color: '#364562'
  }
]
