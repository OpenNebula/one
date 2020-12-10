import { Actions, Commands } from 'server/utils/constants/commands/user'
import httpCodes from 'server/utils/constants/http-codes'
import { requestData, requestParams } from 'client/utils'

export const getUser = ({ filter, id }) => {
  const name = Actions.USER_INFO
  const { url, options } = requestParams(
    { filter, id },
    { name, ...Commands[name] }
  )

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data?.USER ?? {}
  })
}

export const changeGroup = values => {
  const name = Actions.USER_CHGRP
  const { url, options } = requestParams(values, { name, ...Commands[name] })

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return res?.data ?? {}
  })
}

export default {
  changeGroup
}
