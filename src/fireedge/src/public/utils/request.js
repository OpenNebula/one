import { jwtName } from 'client/constants';
import { removeStoreData } from 'client/utils';
import { from as resourceFrom } from 'server/utils/constants/defaults';

export const getQueries = params =>
  Object.entries(params)
    ?.filter(([, { from }]) => from === resourceFrom.query)
    ?.map(([name, { value }]) => `${name}=${encodeURI(value)}`)
    ?.join('&');

export const getResources = params =>
  Object.values(params)
    ?.filter(({ from }) => from === resourceFrom.resource)
    ?.map(({ value }) => value)
    ?.join('/');

export const getDataBody = params =>
  Object.entries(params)
    ?.filter(([, { from }]) => from === resourceFrom.postBody)
    ?.reduce((acc, [name, { value }]) => ({ ...acc, [name]: value }), {});

export const requestParams = (data, command) => {
  if (command === undefined) throw new Error('command not exists');
  const { name, httpMethod, params } = command;

  /* Spread 'from' values in current params */
  const mappedParams =
    Object.entries(params)?.reduce(
      (acc, [param, { from }]) => ({
        ...acc,
        [param]: { from, value: data[param] }
      }),
      {}
    ) ?? {};

  const queries = getQueries(mappedParams);
  const resources = getResources(mappedParams);
  const body = getDataBody(mappedParams);

  const url = `/api/${name.replace('.', '/')}`;

  return {
    url: `${url}/${resources}?${queries}`,
    options: {
      data: body,
      method: httpMethod,
      authenticate: true,
      error: err => {
        removeStoreData(jwtName);
        return err?.message;
      }
    }
  };
};
