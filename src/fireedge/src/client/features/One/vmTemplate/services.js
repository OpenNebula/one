import { Actions, Commands } from 'server/utils/constants/commands/template'
import { httpCodes } from 'server/utils/constants'
import { requestParams, RestClient } from 'client/utils'
import { poolRequest } from 'client/features/One/utils'

export const vmTemplateService = ({
  getVmTemplate: ({ filter, id }) => {
    const name = Actions.TEMPLATE_INFO
    const { url, options } = requestParams(
      { filter, id },
      { name, ...Commands[name] }
    )

    return RestClient.get(url, options).then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data?.VMTEMPLATE ?? {}
    })
  },
  getVmTemplates: data => {
    const name = Actions.TEMPLATE_POOL_INFO
    const command = { name, ...Commands[name] }
    return poolRequest(data, command, 'VMTEMPLATE')
  }
})
