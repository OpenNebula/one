import { createAction } from 'client/features/One/utils'
import { vmService } from 'client/features/One/vm/services'

export const getVm = createAction('vm', vmService.getVm)

export const getVms = createAction(
  'vm/pool',
  vmService.getVms,
  response => ({ vms: response })
)

export const terminateVm = createAction(
  'provider/delete',
  payload => vmService.actionVm({
    ...payload,
    action: {
      params: { hard: false },
      perform: 'terminate'
    }
  })
)
