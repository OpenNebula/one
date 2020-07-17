import { useSelector } from 'react-redux';

export default function useSystem() {
  const System = useSelector(state => state.System);

  return {
    system: System
  };
}
