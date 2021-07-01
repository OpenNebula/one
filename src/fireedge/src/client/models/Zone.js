import * as STATES from 'client/constants/states'
import COLOR from 'client/constants/color'

const ZONE_STATES = [
  { // 0
    name: STATES.ENABLED,
    color: COLOR.success.main
  },
  { // 1
    name: STATES.DISABLED,
    color: COLOR.debug.main
  }
]

export const getState = ({ STATE = 0 } = {}) => ZONE_STATES[+STATE]
