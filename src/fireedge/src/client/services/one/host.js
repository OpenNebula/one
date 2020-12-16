import { Actions, Commands } from 'server/utils/constants/commands/host'
import httpCodes from 'server/utils/constants/http-codes'
import { requestData, requestParams } from 'client/utils'

export const getHost = ({ filter, id }) => {
  const name = Actions.HOST_INFO
  const { url, options } = requestParams(
    { filter, id },
    { name, ...Commands[name] }
  )

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.HOST ?? {}
  })
}
