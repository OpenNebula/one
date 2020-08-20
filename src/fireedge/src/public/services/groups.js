import { Actions, Commands } from 'server/utils/constants/commands/group';
import { requestData, requestParams } from 'client/utils';
import httpCodes from 'server/utils/constants/http-codes';

export const getGroups = () => {
  const name = Actions.GROUP_POOL_INFO;
  const { url, options } = requestParams({}, { name, ...Commands[name] });

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res;

    return [res?.data?.GROUP_POOL?.GROUP ?? []].flat();
  });
};

export default {
  getGroups
};
