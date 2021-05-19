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

export const PROVISIONS_TYPES = {
  metal: {
    id: 'metal',
    name: 'Metal'
  },
  onprem: {
    id: 'onprem',
    name: 'On-premise'
  },
  virtual: {
    id: 'virtual',
    name: 'Virtual'
  }
}

export const PROVIDERS_TYPES = {
  aws: {
    id: 'aws',
    name: 'AWS',
    color: '#ef931f'
  },
  packet: {
    id: 'packet',
    name: 'Packet',
    color: '#364562'
  },
  dummy: {
    id: 'dummy',
    name: 'Dummy',
    color: '#436637'
  },
  digitalocean: {
    id: 'digitalocean',
    name: 'Digital Ocean',
    color: '#2381f5'
  },
  vultr_virtual: {
    id: 'vultr_virtual',
    name: 'Vultr Cloud Compute',
    color: '#7ea3ca'
  },
  vultr_metal: {
    id: 'vultr_metal',
    name: 'Vultr Bare Metal',
    color: '#7ea3ca'
  },
  google: {
    id: 'google',
    name: 'Google Cloud',
    color: '#dc382b'
  }
}

export const CREDENTIALS_FILE = {
  // Google Cloud provider needs an input file to credential connection
  [PROVIDERS_TYPES.google.id]: 'credentials'
}
