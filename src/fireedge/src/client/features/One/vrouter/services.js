import { Actions, Commands } from 'server/utils/constants/commands/vrouter'
import { httpCodes } from 'server/utils/constants'
import { requestParams, RestClient } from 'client/utils'
import { poolRequest } from 'client/features/One/utils'

export const vRouterService = ({
  getVRouter: ({ filter, id }) => {
    const name = Actions.VROUTER_INFO
    const { url, options } = requestParams(
      { filter, id },
      { name, ...Commands[name] }
    )

    return RestClient.get(url, options).then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data?.VROUTER ?? {}
    })
  },
  getVRouters: data => {
    const name = Actions.VROUTER_POOL_INFO
    const command = { name, ...Commands[name] }
    return poolRequest(data, command, 'VROUTER')
  }
})
