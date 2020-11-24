import * as STATES from 'client/constants/states'

const HOST_STATES = [
  {
    name: STATES.INIT,
    shortName: 'init',
    color: '#4DBBD3'
  },
  {
    name: STATES.MONITORING_MONITORED,
    shortName: 'update',
    color: '#4DBBD3'
  },
  {
    name: STATES.MONITORED,
    shortName: 'on',
    color: '#3adb76'
  },
  {
    name: STATES.ERROR,
    shortName: 'err',
    color: '#ec5840'
  },
  {
    name: STATES.DISABLED,
    shortName: 'dsbl',
    color: '#ffa07a'
  },
  {
    name: STATES.MONITORING_ERROR,
    shortName: 'retry',
    color: '#ec5840'
  },
  {
    name: STATES.MONITORING_INIT,
    shortName: 'init',
    color: '#4DBBD3'
  },
  {
    name: STATES.MONITORING_DISABLED,
    shortName: 'dsbl',
    color: '#ffa07a'
  },
  {
    name: STATES.OFFLINE,
    shortName: 'off',
    color: '#ec5840'
  }
]

export default {
  STATES: HOST_STATES
}
