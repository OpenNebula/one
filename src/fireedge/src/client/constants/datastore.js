import * as STATES from 'client/constants/states'
import COLOR from 'client/constants/color'

export const DATASTORE_TYPES = [
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

export const DATASTORE_STATES = [
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
