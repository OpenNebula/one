import { useCallback } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';

import actions, {
  startOneRequest,
  failureOneRequest
} from 'client/actions/pool';

import * as serviceApplication from 'client/services/application';
import { filterBy } from 'client/utils/helpers';

export default function useOpennebula() {
  const dispatch = useDispatch();
  const {
    applications,
    applicationsTemplates,
    filterPool: filter
  } = useSelector(
    state => ({
      ...state?.Opennebula,
      filterPool: state?.Authenticated?.filterPool
    }),
    shallowEqual
  );

  const getApplications = useCallback(
    ({ end, start } = { end: -1, start: -1 }) => {
      dispatch(startOneRequest());
      return serviceApplication
        .getApplications({ filter, end, start })
        .then(data =>
          dispatch(
            actions.setApplications(filterBy(applications.concat(data), 'ID'))
          )
        )
        .catch(err => {
          dispatch(failureOneRequest({ error: err }));
        });
    },
    [dispatch, filter, applications]
  );

  const getApplicationTemplate = useCallback(
    ({ id }) => {
      dispatch(startOneRequest());
      return serviceApplication.getTemplate({ id }).catch(err => {
        dispatch(failureOneRequest({ error: err }));
      });
    },
    [dispatch]
  );

  const getApplicationsTemplates = useCallback(
    ({ end, start } = { end: -1, start: -1 }) => {
      dispatch(startOneRequest());
      return serviceApplication
        .getTemplates({ filter, end, start })
        .then(data =>
          dispatch(
            actions.setApplicationsTemplates(
              filterBy(applicationsTemplates.concat(data), 'ID')
            )
          )
        )
        .catch(err => {
          dispatch(failureOneRequest({ error: err }));
        });
    },
    [dispatch, filter, applicationsTemplates]
  );

  const createApplicationTemplate = useCallback(
    ({ data }) => {
      dispatch(startOneRequest());
      return serviceApplication.createTemplate({ data }).catch(err => {
        dispatch(failureOneRequest({ error: err }));
      });
    },
    [dispatch]
  );

  const updateApplicationTemplate = useCallback(
    ({ id, data }) => {
      dispatch(startOneRequest());
      return serviceApplication.updateTemplate({ id, data }).catch(err => {
        dispatch(failureOneRequest({ error: err }));
      });
    },
    [dispatch]
  );

  return {
    applications,
    getApplications,

    applicationsTemplates,
    getApplicationTemplate,
    getApplicationsTemplates,
    createApplicationTemplate,
    updateApplicationTemplate
  };
}
