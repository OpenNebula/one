import * as STATES from 'client/constants/states'
import COLOR from 'client/constants/color'

export const HOST_STATES = [
  {
    name: STATES.INIT,
    shortName: 'init',
    color: COLOR.info.main
  },
  {
    name: STATES.MONITORING_MONITORED,
    shortName: 'update',
    color: COLOR.info.main
  },
  {
    name: STATES.MONITORED,
    shortName: 'on',
    color: COLOR.success.main
  },
  {
    name: STATES.ERROR,
    shortName: 'err',
    color: COLOR.error.dark
  },
  {
    name: STATES.DISABLED,
    shortName: 'dsbl',
    color: COLOR.error.light
  },
  {
    name: STATES.MONITORING_ERROR,
    shortName: 'retry',
    color: COLOR.error.dark
  },
  {
    name: STATES.MONITORING_INIT,
    shortName: 'init',
    color: COLOR.info.main
  },
  {
    name: STATES.MONITORING_DISABLED,
    shortName: 'dsbl',
    color: COLOR.error.light
  },
  {
    name: STATES.OFFLINE,
    shortName: 'off',
    color: COLOR.error.dark
  }
]
