import * as STATES from 'client/constants/states'
import COLOR from 'client/constants/color'

const IMAGE_TYPES = [
  'OS',
  'CD ROM',
  'DATABLOCK',
  'KERNEL',
  'RAMDISK',
  'CONTEXT'
]

const IMAGE_STATES = [
  { // 0
    name: STATES.INIT,
    color: COLOR.debug.main
  },
  { // 1
    name: STATES.READY,
    color: COLOR.success.main
  },
  { // 2
    name: STATES.USED,
    color: COLOR.success.main
  },
  { // 3
    name: STATES.DISABLED,
    color: COLOR.debug.light
  },
  { // 4
    name: STATES.LOCKED,
    color: COLOR.warning.main
  },
  { // 5
    name: STATES.ERROR,
    color: COLOR.error.main
  },
  { // 6
    name: STATES.CLONE,
    color: COLOR.info.light
  },
  { // 7
    name: STATES.DELETE,
    color: COLOR.error.main
  },
  { // 8
    name: STATES.USED_PERS,
    color: COLOR.error.light
  },
  { // 9
    name: STATES.LOCKED_USED,
    color: COLOR.warning.light
  },
  { // 10
    name: STATES.LOCKED_USED_PERS,
    color: COLOR.error.light
  }
]

const DISK_TYPES = [
  'FILE',
  'CD ROM',
  'BLOCK',
  'RBD'
]

export const getType = ({ TYPE } = {}) => IMAGE_TYPES[+TYPE]

export const getDiskType = ({ DISK_TYPE } = {}) => DISK_TYPES[+DISK_TYPE]

export const getState = ({ STATE } = {}) => IMAGE_STATES[+STATE]
