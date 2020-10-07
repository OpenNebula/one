const START_AUTH = 'START_AUTH';
const SELECT_FILTER_GROUP = 'SELECT_FILTER_GROUP';
const SUCCESS_AUTH = 'SUCCESS_AUTH';
const FAILURE_AUTH = 'FAILURE_AUTH';
const LOGOUT = 'LOGOUT';

const Actions = {
  START_AUTH,
  SELECT_FILTER_GROUP,
  SUCCESS_AUTH,
  FAILURE_AUTH,
  LOGOUT
};

module.exports = {
  Actions,
  startAuth: () => ({
    type: START_AUTH
  }),
  selectFilterGroup: payload => ({
    type: SELECT_FILTER_GROUP,
    payload
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
