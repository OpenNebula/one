import { Actions, Commands } from 'server/utils/constants/commands/user';
import { requestData, requestParams } from 'client/utils';
import httpCodes from 'server/utils/constants/http-codes';

export const changeGroup = values => {
  const name = Actions.USER_CHGRP;
  const { url, options } = requestParams(values, { name, ...Commands[name] });

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res;

    return res?.data ?? {};
  });
};

export const getUsers = () => {
  const name = Actions.USER_POOL_INFO;
  const { url, options } = requestParams({}, { name, ...Commands[name] });

  return requestData(url, options).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res;

    return [res?.data?.USER_POOL?.USER ?? []].flat();
  });
};

export default {
  changeGroup,
  getUsers
};
