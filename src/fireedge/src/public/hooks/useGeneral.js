import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import actions from 'client/actions/general';

export default function useGeneral() {
  const dispatch = useDispatch();
  const { isOpenMenu } = useSelector(state => state?.General);

  const changeZone = useCallback(
    zone => dispatch({ type: actions.CHANGE_ZONE, payload: zone }),
    [dispatch]
  );

  const changeLoading = useCallback(
    isLoading =>
      dispatch({ type: actions.DISPLAY_LOADING, payload: isLoading }),
    [dispatch]
  );

  const changeMenu = useCallback(
    isOpen => dispatch({ type: actions.DISPLAY_MENU, payload: isOpen }),
    [dispatch]
  );

  return {
    isOpenMenu,
    changeZone,
    changeLoading,
    changeMenu
  };
}
