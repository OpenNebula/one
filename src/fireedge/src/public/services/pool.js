import User from 'server/utils/constants/commands/user';
import Group from 'server/utils/constants/commands/group';
import VNet from 'server/utils/constants/commands/vn';
import VNetTemplate from 'server/utils/constants/commands/vntemplate';
import Template from 'server/utils/constants/commands/template';
import Cluster from 'server/utils/constants/commands/cluster';

import httpCodes from 'server/utils/constants/http-codes';
import { requestData, requestParams } from 'client/utils';

export const getUsers = ({ filter }) => {
  const name = User.Actions.USER_POOL_INFO;
  const { url, options } = requestParams(
    { filter },
    { name, ...User.Commands[name] }
  );

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res;

    return [res?.data?.USER_POOL?.USER ?? []].flat();
  });
};

export const getGroups = ({ filter }) => {
  const name = Group.Actions.GROUP_POOL_INFO;
  const { url, options } = requestParams(
    { filter },
    { name, ...Group.Commands[name] }
  );

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res;

    return [res?.data?.GROUP_POOL?.GROUP ?? []].flat();
  });
};

export const getVNetworks = ({ filter }) => {
  const name = VNet.Actions.VN_POOL_INFO;
  const { url, options } = requestParams(
    { filter },
    { name, ...VNet.Commands[name] }
  );

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res;

    return [res?.data?.VNET_POOL?.VNET ?? []].flat();
  });
};

export const getVNetworksTemplates = ({ filter }) => {
  const name = VNetTemplate.Actions.VNTEMPLATE_POOL_INFO;
  const { url, options } = requestParams(
    { filter },
    { name, ...VNetTemplate.Commands[name] }
  );

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res;

    return [res?.data?.VNTEMPLATE_POOL?.VNTEMPLATE ?? []].flat();
  });
};

export const getTemplates = ({ filter }) => {
  const name = Template.Actions.TEMPLATE_POOL_INFO;
  const { url, options } = requestParams(
    { filter },
    { name, ...Template.Commands[name] }
  );

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res;

    return [res?.data?.VMTEMPLATE_POOL?.VMTEMPLATE ?? []].flat();
  });
};

export const getClusters = ({ filter }) => {
  const name = Cluster.Actions.CLUSTER_POOL_INFO;
  const { url, options } = requestParams(
    { filter },
    { name, ...Cluster.Commands[name] }
  );

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res;

    return [res?.data?.CLUSTER_POOL?.CLUSTER ?? []].flat();
  });
};

export default {
  getUsers,
  getGroups,
  getVNetworks,
  getVNetworksTemplates,
  getTemplates,
  getClusters
};
