import { endpointsRoutes } from 'client/constants';
import { requestData } from 'client/utils';
import httpCodes from 'server/utils/constants/http-codes';

export const login = (user, baseURL = '') =>
  requestData(endpointsRoutes.login, {
    data: user,
    method: 'POST',
    authenticate: false,
    baseURL,
    error: console.error
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw new Error(res);

    return res;
  });

export const getUser = () =>
  requestData(endpointsRoutes.userInfo).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw new Error(res);

    return res;
  });

export default {
  login,
  getUser
};
