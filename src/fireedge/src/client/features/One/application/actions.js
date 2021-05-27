import { createAction } from 'client/features/One/utils'
import { applicationService } from 'client/features/One/application/services'

export const getApplication = createAction('cluster', applicationService.getApplication)

export const getApplications = createAction(
  'application/pool',
  applicationService.getApplications,
  response => ({ applications: response })
)
