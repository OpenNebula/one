export const CHANGE_ZONE = 'CHANGE_ZONE';
export const DISPLAY_LOADING = 'DISPLAY_LOADING';
export const TOGGLE_MENU = 'TOGGLE_MENU';

export const changeZone = zone => ({
  type: CHANGE_ZONE,
  payload: { zone }
});

export const changeLoading = isLoading => ({
  type: DISPLAY_LOADING,
  payload: { isLoading }
});

export const openMenu = isOpen => ({
  type: TOGGLE_MENU,
  isOpen
});
