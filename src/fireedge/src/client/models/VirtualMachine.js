import { STATES, VM_STATES, VM_LCM_STATES } from 'client/constants'

export const filterDoneVms = (vms = []) =>
  vms.filter(({ STATE }) => VM_STATES[STATE]?.name !== STATES.DONE)

export const getState = ({ STATE, LCM_STATE } = {}) => {
  const state = VM_STATES[+STATE]

  return state?.name === STATES.ACTIVE ? VM_LCM_STATES[+LCM_STATE] : state
}
