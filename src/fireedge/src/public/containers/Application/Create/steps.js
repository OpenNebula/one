import React, { useMemo } from 'react';
import * as yup from 'yup';

import useOpennebula from 'client/hooks/useOpennebula';

import { NetworkDialog, RoleDialog } from 'client/components/Dialogs';
import { NetworkCard, RoleCard, ClusterCard } from 'client/components/Cards';
import FormStep from 'client/components/FormStepper/FormStep';
import FormDialog from 'client/components/FormStepper/FormDialog';
import FormListSelect from 'client/components/FormStepper/FormListSelect';

import FormWithSchema from 'client/components/Forms/FormWithSchema';
import Schema, {
  SHUTDOWN_ACTIONS,
  STRATEGIES_DEPLOY
} from 'client/containers/Application/Create/schema';

function Steps() {
  const {
    clusters,
    getClusters,
    getVNetworks,
    getVNetworksTemplates,
    getTemplates
  } = useOpennebula();

  const steps = useMemo(
    () => [
      {
        id: 'service',
        label: 'Service configuration',
        content: FormStep,
        defaultValue: Schema?.reduce(
          (val, { name, initial }) => ({ ...val, [name]: initial }),
          {}
        ),
        resolver: yup.object().shape({
          name: yup
            .string()
            .min(5)
            .trim()
            .required('is required'),
          description: yup.string().trim(),
          deployment: yup
            .string()
            .required()
            .oneOf(STRATEGIES_DEPLOY.map(({ value }) => value)),
          shutdown_action: yup
            .string()
            .oneOf(SHUTDOWN_ACTIONS.map(({ value }) => value)),
          ready_status_gate: yup.boolean()
        }),
        FormComponent: props => (
          <FormWithSchema cy="form-flow" schema={Schema} {...props} />
        )
      },
      {
        id: 'networks',
        label: 'Networks configuration',
        content: FormDialog,
        preRender: () => {
          getVNetworks();
          getVNetworksTemplates();
        },
        defaultValue: [],
        resolver: yup
          .array()
          .min(2)
          .required(),
        addCardAction: true,
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
        content: FormDialog,
        preRender: getTemplates,
        defaultValue: [],
        resolver: yup
          .array()
          .min(1)
          .required(),
        addCardAction: true,
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
        id: 'clusters',
        label: 'Where will it run?',
        content: FormListSelect,
        defaultValue: [],
        resolver: yup
          .array()
          .min(1)
          .max(1)
          .required(),
        onlyOneSelect: true,
        preRender: getClusters,
        list: clusters,
        InfoComponent: ClusterCard
      }
    ],
    [getVNetworks, getVNetworksTemplates, getTemplates, getClusters, clusters]
  );

  const defaultValues = useMemo(
    () =>
      steps.reduce(
        (values, { id, defaultValue }) => ({ ...values, [id]: defaultValue }),
        {}
      ),
    [steps]
  );

  const resolvers = useMemo(
    () =>
      yup
        .object()
        .shape(
          steps.reduce(
            (values, { id, resolver }) => ({ ...values, [id]: resolver }),
            {}
          )
        )
        .required(),
    [steps]
  );

  return { steps, defaultValues, resolvers };
}

export default Steps;
