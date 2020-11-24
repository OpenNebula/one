import * as STATES from 'client/constants/states'

const DATASTORE_TYPES = [
  {
    name: 'IMAGE',
    shortName: 'img'
  },
  {
    name: 'SYSTEM',
    shortName: 'sys'
  },
  {
    name: 'FILE',
    shortName: 'fil'
  }
]

const DATASTORE_STATES = [
  {
    name: STATES.READY,
    shortName: 'on',
    color: '#3adb76'
  },
  {
    name: STATES.DISABLED,
    shortName: 'off',
    color: '#ec5840'
  }
]

export default {
  TYPES: DATASTORE_TYPES,
  STATES: DATASTORE_STATES
}
