import * as STATES from 'client/constants/states'
import COLOR from 'client/constants/color'

const MARKETPLACE_APP_TYPES = [
  'UNKNOWN',
  'IMAGE',
  'VM TEMPLATE',
  'SERVICE TEMPLATE'
]

const MARKETPLACE_APP_STATES = [
  { // 0
    name: STATES.INIT,
    color: COLOR.info.main
  },
  { // 1
    name: STATES.READY,
    color: COLOR.success.main
  },
  { // 2
    name: STATES.LOCKED,
    color: COLOR.debug.main
  },
  { // 3
    name: STATES.ERROR,
    color: COLOR.error.main
  },
  { // 4
    name: STATES.DISABLED,
    color: COLOR.debug.light
  }
]

export const getType = ({ TYPE = 0 } = {}) => MARKETPLACE_APP_TYPES[+TYPE]

export const getState = ({ STATE } = {}) => MARKETPLACE_APP_STATES[+STATE]
