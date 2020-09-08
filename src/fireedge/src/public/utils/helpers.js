export const fakeDelay = ms => new Promise(resolve => setTimeout(resolve, ms));

export const debounce = (func, delay, immediate) => {
  let timerId;
  return (...args) => {
    const boundFunc = func.bind(this, ...args);
    clearTimeout(timerId);
    if (immediate && !timerId) {
      boundFunc();
    }
    const calleeFunc = immediate
      ? () => {
          timerId = null;
        }
      : boundFunc;
    timerId = setTimeout(calleeFunc, delay);
  };
};
