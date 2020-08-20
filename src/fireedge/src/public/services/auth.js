import { httpCodes } from 'server/utils/constants';
import { jwtName, endpointsRoutes } from 'client/constants';
import { requestData, removeStoreData } from 'client/utils';

export const login = (user, baseURL = '') =>
  requestData(endpointsRoutes.login, {
    baseURL,
    data: user,
    method: 'POST',
    authenticate: false,
    error: err => {
      removeStoreData(jwtName);
      return err?.message;
    }
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) {
      if (res?.id === httpCodes.accepted.id) return res;
      throw res;
    }

    return res?.data;
  });

export const getUser = (baseURL = '') =>
  requestData(endpointsRoutes.userInfo, {
    baseURL,
    error: err => {
      removeStoreData(jwtName);
      return err?.message;
    }
  }).then(res => {
    if (!res?.id || res?.id !== httpCodes.ok.id) throw res;

    return res?.data?.USER ?? {};
  });

export default {
  login,
  getUser
};
