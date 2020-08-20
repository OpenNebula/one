const CHANGE_ZONE = 'CHANGE_ZONE';
const DISPLAY_LOADING = 'DISPLAY_LOADING';
const TOGGLE_MENU = 'TOGGLE_MENU';

const Actions = {
  CHANGE_ZONE,
  DISPLAY_LOADING,
  TOGGLE_MENU
};

module.exports = {
  Actions,
  changeZone: zone => ({
    type: CHANGE_ZONE,
    payload: { zone }
  }),
  changeLoading: isLoading => ({
    type: DISPLAY_LOADING,
    payload: { isLoading }
  }),
  openMenu: isOpen => ({
    type: TOGGLE_MENU,
    isOpen
  })
};
