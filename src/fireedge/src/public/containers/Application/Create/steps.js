import { NetworkDialog, RoleDialog } from 'client/components/Dialogs';
import { NetworkCard, RoleCard } from 'client/components/Cards';
import FormStep from 'client/components/FormStepper/FormStep';

export default [
  {
    id: 'networks',
    label: 'Networks configuration',
    content: FormStep,
    preRender: () => undefined,
    addAction: true,
    DEFAULT_DATA: {
      mandatory: true,
      name: 'Public_dev',
      description: 'Public network in development mode',
      type: 'id',
      id: '0',
      extra: 'size=5'
    },
    InfoComponent: NetworkCard,
    DialogComponent: NetworkDialog
  },
  {
    id: 'roles',
    label: 'Defining each role',
    content: FormStep,
    preRender: () => undefined,
    addAction: true,
    DEFAULT_DATA: {
      name: 'Master_dev',
      cardinality: 2,
      vm_template: 0,
      elasticity_policies: [],
      scheduled_policies: []
    },
    InfoComponent: RoleCard,
    DialogComponent: RoleDialog
  },
  {
    id: 'where',
    label: 'Where will it run?',
    content: FormStep,
    preRender: () => undefined
  }
];
