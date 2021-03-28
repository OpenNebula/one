import Cluster from 'server/utils/constants/commands/cluster'
import Datastore from 'server/utils/constants/commands/datastore'
import Host from 'server/utils/constants/commands/host'
import Group from 'server/utils/constants/commands/group'
import MarketApp from 'server/utils/constants/commands/marketapp'
import Template from 'server/utils/constants/commands/template'
import User from 'server/utils/constants/commands/user'
import VNet from 'server/utils/constants/commands/vn'
import VNetTemplate from 'server/utils/constants/commands/vntemplate'

import httpCodes from 'server/utils/constants/http-codes'
import { requestData, requestParams } from 'client/utils'

export const getUsers = ({ filter } = {}) => {
  const name = User.Actions.USER_POOL_INFO
  const { url, options } = requestParams(
    { filter },
    { name, ...User.Commands[name] }
  )

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.USER_POOL?.USER ?? []].flat()
  })
}

export const getGroups = ({ filter } = {}) => {
  const name = Group.Actions.GROUP_POOL_INFO
  const { url, options } = requestParams(
    { filter },
    { name, ...Group.Commands[name] }
  )

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.GROUP_POOL?.GROUP ?? []].flat()
  })
}

export const getVNetworks = ({ filter } = {}) => {
  const name = VNet.Actions.VN_POOL_INFO
  const { url, options } = requestParams(
    { filter },
    { name, ...VNet.Commands[name] }
  )

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.VNET_POOL?.VNET ?? []].flat()
  })
}

export const getVNetworksTemplates = ({ filter } = {}) => {
  const name = VNetTemplate.Actions.VNTEMPLATE_POOL_INFO
  const { url, options } = requestParams(
    { filter },
    { name, ...VNetTemplate.Commands[name] }
  )

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.VNTEMPLATE_POOL?.VNTEMPLATE ?? []].flat()
  })
}

export const getTemplates = ({ filter, end, start } = {}) => {
  const name = Template.Actions.TEMPLATE_POOL_INFO
  const { url, options } = requestParams(
    { filter, end, start },
    { name, ...Template.Commands[name] }
  )

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.VMTEMPLATE_POOL?.VMTEMPLATE ?? []].flat()
  })
}

export const getMarketApps = ({ filter, end, start } = {}) => {
  const name = MarketApp.Actions.MARKETAPP_POOL_INFO
  const { url, options } = requestParams(
    { filter, end, start },
    { name, ...MarketApp.Commands[name] }
  )

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.MARKETPLACEAPP_POOL?.MARKETPLACEAPP ?? []].flat()
  })
}

export const getClusters = ({ filter } = {}) => {
  const name = Cluster.Actions.CLUSTER_POOL_INFO
  const { url, options } = requestParams(
    { filter },
    { name, ...Cluster.Commands[name] }
  )

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.CLUSTER_POOL?.CLUSTER ?? []].flat()
  })
}

export const getDatastores = ({ filter } = {}) => {
  const name = Datastore.Actions.DATASTORE_POOL_INFO
  const { url, options } = requestParams(
    { filter },
    { name, ...Datastore.Commands[name] }
  )

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.DATASTORE_POOL?.DATASTORE ?? []].flat()
  })
}

export const getHosts = ({ filter } = {}) => {
  const name = Host.Actions.HOST_POOL_INFO
  const { url, options } = requestParams(
    { filter },
    { name, ...Host.Commands[name] }
  )

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res

    return [res?.data?.HOST_POOL?.HOST ?? []].flat()
  })
}

export default {
  getUsers,
  getGroups,
  getVNetworks,
  getVNetworksTemplates,
  getTemplates,
  getMarketApps,
  getClusters,
  getDatastores
}
