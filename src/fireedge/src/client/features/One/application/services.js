import { SERVICE } from 'server/routes/api/oneflow/string-routes'
import { httpCodes } from 'server/utils/constants'
import { RestClient } from 'client/utils'
import { poolRequest } from 'client/features/One/utils'

export const applicationService = ({
  getApplication: ({ filter, id }) => RestClient
    .get(`/api/${SERVICE}/list/${id}`, { filter })
    .then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data?.DOCUMENT ?? {}
    }),

  getApplications: data => {
    const command = { name: `${SERVICE}.list`, params: {} }
    return poolRequest(data, command, 'DOCUMENT')
  }
})
