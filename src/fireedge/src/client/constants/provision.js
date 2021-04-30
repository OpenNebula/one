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
    id: 'aws',
    name: 'AWS',
    color: '#ef931f'
  },
  {
    id: 'packet',
    name: 'Packet',
    color: '#364562'
  },
  {
    id: 'dummy',
    name: 'Dummy',
    color: '#436637'
  },
  {
    id: 'google',
    name: 'Google Cloud',
    color: 'linear-gradient(90deg, #fbbc05 0%, #ea4335 33%, #34a853 66%, #4285f4 100%)'
  },
  {
    id: 'digitalocean',
    name: 'Digital Ocean',
    color: '#2381f5'
  }
]
