import { Actions, Commands } from 'server/utils/constants/commands/vntemplate'
import { httpCodes } from 'server/utils/constants'
import { requestParams, RestClient } from 'client/utils'
import { poolRequest } from 'client/features/One/utils'

export const vNetworkTemplateService = ({
  getVNetworkTemplate: ({ filter, id }) => {
    const name = Actions.VNTEMPLATE_INFO
    const { url, options } = requestParams(
      { filter, id },
      { name, ...Commands[name] }
    )

    return RestClient.get(url, options).then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data?.VNTEMPLATE ?? {}
    })
  },
  getVNetworksTemplates: data => {
    const name = Actions.VNTEMPLATE_POOL_INFO
    const command = { name, ...Commands[name] }
    return poolRequest(data, command, 'VNTEMPLATE')
  }
})
