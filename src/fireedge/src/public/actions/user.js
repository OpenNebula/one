export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';
export const LOGOUT = 'LOGOUT';

export const USER_REQUEST = 'USER_REQUEST';
export const USER_SUCCESS = 'USER_SUCCESS';
export const USER_FAILURE = 'USER_FAILURE';

export const loginRequest = () => ({
  type: LOGIN_REQUEST
});

export const loginSuccess = jwt => ({
  type: LOGIN_SUCCESS,
  jwt
});

export const loginFailure = message => ({
  type: LOGIN_FAILURE,
  message
});

export const logout = () => ({
  type: LOGOUT
});

export const userRequest = () => ({
  type: USER_REQUEST
});

export const userSuccess = user => ({
  type: USER_SUCCESS,
  user
});

export const userFailure = message => ({
  type: USER_FAILURE,
  message
});
