import React, { useState, useEffect, useCallback } from 'react';

import useOpennebula from 'client/hooks/useOpennebula';

import { DialogForm } from 'client/components/Dialogs';
import { NetworkCard } from 'client/components/Cards';

import useListForm from 'client/hooks/useListForm';
import FormWithSchema from 'client/components/Forms/FormWithSchema';
import ListCards from 'client/components/List/ListCards';

import { FORM_FIELDS, NETWORK_FORM_SCHEMA, STEP_FORM_SCHEMA } from './schema';

export const STEP_ID = 'networking';

const Networks = () => ({
  id: STEP_ID,
  label: 'Configure Networking',
  resolver: STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const [showDialog, setShowDialog] = useState(false);
    const { getVNetworks, getVNetworksTemplates } = useOpennebula();
    const {
      editingData,
      handleSave,
      handleEdit,
      handleClone,
      handleRemove
    } = useListForm({
      key: STEP_ID,
      list: data,
      setList: setFormData,
      defaultValue: NETWORK_FORM_SCHEMA.default()
    });

    useEffect(() => {
      getVNetworks();
      getVNetworksTemplates();
    }, []);

    return (
      <>
        <ListCards
          list={data}
          CardComponent={NetworkCard}
          handleCreate={() => {
            handleEdit();
            setShowDialog(true);
          }}
          cardsProps={({ index }) => ({
            handleEdit: () => {
              handleEdit(index);
              setShowDialog(true);
            },
            handleClone: () => handleClone(index),
            handleRemove: () => handleRemove(index)
          })}
        />
        {showDialog && (
          <DialogForm
            title={'Network form'}
            resolver={NETWORK_FORM_SCHEMA}
            open={showDialog}
            values={editingData?.data}
            onSubmit={values => {
              handleSave(values);
              setShowDialog(false);
            }}
            onCancel={() => setShowDialog(false)}
          >
            <FormWithSchema cy="form-dg-network" fields={FORM_FIELDS} />
          </DialogForm>
        )}
      </>
    );
  }, [])
});

export default Networks;
