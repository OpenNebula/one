import { endpointsRoutes } from 'client/constants';
import { requestData } from 'client/utils';
import httpCodes from 'server/utils/constants/http-codes';

export const loginService = (user, baseURL = '') =>
  requestData(endpointsRoutes.login, {
    data: user,
    method: 'POST',
    authenticate: false,
    baseURL,
    error: console.error
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id)
      throw new Error('Response is NOT ok');

    return res;
  });

export const authUserService = () =>
  requestData(endpointsRoutes.userInfo).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id)
      throw new Error('Response is NOT ok');

    return res;
  });

export default {
  loginService,
  authUserService
};
