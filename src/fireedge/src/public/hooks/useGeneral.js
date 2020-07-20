import { useCallback } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';

import * as actions from 'client/actions/general';

export default function useGeneral() {
  const { isLoading, isOpenMenu } = useSelector(state => state?.General, shallowEqual);
  const dispatch = useDispatch();

  const openMenu = useCallback(isOpen => dispatch(actions.openMenu(isOpen)), [
    dispatch
  ]);

  const changeZone = useCallback(zone => dispatch(actions.changeZone(zone)), [
    dispatch
  ]);

  const changeLoading = useCallback(
    loading => dispatch(actions.changeLoading(loading)),
    [dispatch]
  );

  return {
    isLoading,
    isOpenMenu,
    changeZone,
    openMenu,
    changeLoading
  };
}
