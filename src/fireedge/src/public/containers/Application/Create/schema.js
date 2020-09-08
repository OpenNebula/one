import { TYPE_INPUT } from 'client/constants';

export const STRATEGIES_DEPLOY = [
  { text: 'None', value: 'none' },
  { text: 'Straight', value: 'straight' }
];

export const SHUTDOWN_ACTIONS = [
  { text: 'None', value: '' },
  { text: 'Terminate', value: 'shutdown' },
  { text: 'Terminate hard', value: 'shutdown-hard' }
];

export default [
  {
    name: 'name',
    label: 'Name',
    type: TYPE_INPUT.TEXT,
    initial: ''
  },
  {
    name: 'description',
    label: 'Description',
    type: TYPE_INPUT.TEXT,
    multiline: true,
    initial: ''
  },
  {
    name: 'deployment',
    label: 'Select a strategy',
    type: TYPE_INPUT.SELECT,
    initial: STRATEGIES_DEPLOY[1].value,
    values: STRATEGIES_DEPLOY
  },
  {
    name: 'shutdown_action',
    label: 'Select a VM shutdown action',
    type: TYPE_INPUT.SELECT,
    initial: SHUTDOWN_ACTIONS[1].value,
    values: SHUTDOWN_ACTIONS
  },
  {
    name: 'ready_status_gate',
    label:
      'Wait for VMs to report that they are READY via OneGate to consider them running',
    type: TYPE_INPUT.CHECKBOX,
    initial: false
  }
];
