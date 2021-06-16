import { createAction } from 'client/features/One/utils'
import { vmService } from 'client/features/One/vm/services'
import { filterBy } from 'client/utils'

export const getVm = createAction('vm', vmService.getVm)

export const getVms = createAction(
  'vm/pool',
  vmService.getVms,
  (response, { vms: currentVms }) => {
    const vms = filterBy([...currentVms, ...response], 'ID')

    return { vms }
  }
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
