import { Actions, Commands } from 'server/utils/constants/commands/user'
import { httpCodes } from 'server/utils/constants'
import { requestParams, RestClient } from 'client/utils'
import { poolRequest } from 'client/features/One/utils'

export const userService = ({
  getUser: ({ filter, id }) => {
    const name = Actions.USER_INFO
    const { url, options } = requestParams(
      { filter, id },
      { name, ...Commands[name] }
    )

    return RestClient.get(url, options).then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data?.USER ?? {}
    })
  },
  getUsers: data => {
    const name = Actions.USER_POOL_INFO
    const command = { name, ...Commands[name] }
    return poolRequest(data, command, 'USER')
  },
  changeGroup: ({ data }) => {
    const name = Actions.USER_CHGRP
    const { url, options } = requestParams(data, { name, ...Commands[name] })

    return RestClient.put(url, options.data).then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data ?? {}
    })
  },
  updateUser: ({ data }) => {
    const name = Actions.USER_UPDATE
    const { url, options } = requestParams(data, { name, ...Commands[name] })

    return RestClient.put(url, options.data).then(res => {
      if (!res?.id || res?.id !== httpCodes.ok.id) throw res

      return res?.data ?? {}
    })
  }
})
