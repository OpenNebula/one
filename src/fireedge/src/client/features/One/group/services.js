import { Actions, Commands } from 'server/utils/constants/commands/group'
import { httpCodes } from 'server/utils/constants'
import { requestParams, RestClient } from 'client/utils'
import { poolRequest } from 'client/features/One/utils'

export const groupService = ({
  getGroup: ({ filter, id }) => {
    const name = Actions.GROUP_INFO
    const { url, options } = requestParams(
      { filter, id },
      { name, ...Commands[name] }
    )

    return RestClient.get(url, options).then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data?.GROUP ?? {}
    })
  },
  getGroups: data => {
    const name = Actions.GROUP_POOL_INFO
    const command = { name, ...Commands[name] }
    return poolRequest(data, command, 'GROUP')
  }
})
