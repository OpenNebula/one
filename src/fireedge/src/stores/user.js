import { getTimezone, getDateFormat } from '../utils/timezone';

export default {
  state: {
    timezone: getTimezone(),
    dateFormat: getDateFormat()
  },
  mutations: {
    updateTimezone(state) {
      state.timezone = getTimezone();
    }
  }
};
