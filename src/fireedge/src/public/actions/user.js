const START_AUTH = 'START_AUTH';
const SUCCESS_AUTH = 'SUCCESS_AUTH';
const FAILURE_AUTH = 'FAILURE_AUTH';
const LOGOUT = 'LOGOUT';

const Actions = {
  START_AUTH,
  SUCCESS_AUTH,
  FAILURE_AUTH,
  LOGOUT
};

module.exports = {
  Actions,
  startAuth: () => ({
    type: START_AUTH
  }),
  successAuth: payload => ({
    type: SUCCESS_AUTH,
    payload
  }),
  failureAuth: payload => ({
    type: FAILURE_AUTH,
    payload
  }),
  logout: () => ({
    type: LOGOUT
  })
};
