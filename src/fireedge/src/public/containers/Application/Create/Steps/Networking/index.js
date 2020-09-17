import React, { useMemo } from 'react';

import useOpennebula from 'client/hooks/useOpennebula';

import { DialogForm } from 'client/components/Dialogs';
import { NetworkCard } from 'client/components/Cards';

import FormList from 'client/components/FormStepper/FormList';
import FormWithSchema from 'client/components/Forms/FormWithSchema';
import ListCards from 'client/components/List/ListCards';

import { FORM_FIELDS, NETWORK_FORM_SCHEMA, STEP_FORM_SCHEMA } from './schema';

const Networks = () => {
  const STEP_ID = 'networking';
  const { getVNetworks, getVNetworksTemplates } = useOpennebula();

  return useMemo(
    () => ({
      id: STEP_ID,
      label: 'Configure Networking',
      content: FormList,
      preRender: () => {
        getVNetworks();
        getVNetworksTemplates();
      },
      resolver: STEP_FORM_SCHEMA,
      DEFAULT_DATA: NETWORK_FORM_SCHEMA.default(),
      ListComponent: ({ list, handleCreate, itemsProps }) => (
        <ListCards
          list={list}
          handleCreate={handleCreate}
          CardComponent={NetworkCard}
          cardsProps={itemsProps}
        />
      ),
      ItemComponent: NetworkCard,
      DialogComponent: props => (
        <DialogForm
          title={'Network form'}
          resolver={NETWORK_FORM_SCHEMA}
          {...props}
        >
          <FormWithSchema cy="form-dg-network" fields={FORM_FIELDS} />
        </DialogForm>
      )
    }),
    [getVNetworks, getVNetworksTemplates]
  );
};

export default Networks;
