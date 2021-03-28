import * as STATES from 'client/constants/states'
import COLOR from 'client/constants/color'

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
    color: COLOR.success.main
  },
  {
    name: STATES.DISABLED,
    shortName: 'off',
    color: COLOR.error.dark
  }
]

export default {
  TYPES: DATASTORE_TYPES,
  STATES: DATASTORE_STATES
}
