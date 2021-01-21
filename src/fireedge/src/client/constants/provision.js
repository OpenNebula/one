import * as STATES from 'client/constants/states'

export const PROVISIONS_STATES = [
  {
    name: STATES.PENDING,
    color: '#966615',
    meaning: ''
  },
  {
    name: STATES.DEPLOYING,
    color: '#4DBBD3',
    meaning: ''
  },
  {
    name: STATES.CONFIGURING,
    color: '#4DBBD3',
    meaning: ''
  },
  {
    name: STATES.RUNNING,
    color: '#318b77',
    meaning: ''
  },
  {
    name: STATES.ERROR,
    color: '#8c352a',
    meaning: ''
  },
  {
    name: STATES.DELETING,
    color: '#8c352a',
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
