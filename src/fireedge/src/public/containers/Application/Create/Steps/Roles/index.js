import React, { useEffect, useState, useCallback } from 'react';

import * as yup from 'yup';
import { useWatch } from 'react-hook-form';

import useListForm from 'client/hooks/useListForm';
import FormStepper from 'client/components/FormStepper';
import { DialogForm } from 'client/components/Dialogs';
import FlowWithFAB from 'client/components/Flows/FlowWithFAB';

import Steps from './Steps';

export const Context = React.createContext({});
export const STEP_ID = 'tiers';

const Roles = () => {
  const { steps, defaultValues, resolvers } = Steps();

  return {
    id: STEP_ID,
    label: 'Tier Definition',
    DEFAULT_DATA: defaultValues,
    resolver: yup
      .array()
      .of(resolvers)
      .min(1)
      .required()
      .default([]),
    content: useCallback(({ data, setFormData }) => {
      const [showDialog, setShowDialog] = useState(false);
      const [nestedForm, setNestedForm] = useState({});
      const form = useWatch({});

      const { editingData, handleEdit, handleSave } = useListForm({
        key: STEP_ID,
        list: data,
        setList: setFormData,
        defaultValue: defaultValues
      });

      useEffect(() => {
        setNestedForm(form);
      }, []);

      return (
        <>
          <div>
            <button
              onClick={() => {
                handleEdit();
                setShowDialog(true);
              }}
            >
              Add role
            </button>
            <div>{JSON.stringify(data)}</div>
          </div>
          {showDialog && (
            <Context.Provider value={{ nestedForm }}>
              <DialogForm
                open={showDialog}
                title={'Tier form'}
                resolver={resolvers}
                values={editingData.data}
                onCancel={() => setShowDialog(false)}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}
                >
                  <FormStepper
                    steps={steps}
                    initialValue={editingData.data}
                    onSubmit={values => {
                      handleSave(values);
                      setShowDialog(false);
                    }}
                  />
                </div>
              </DialogForm>
            </Context.Provider>
          )}
        </>
      );
    }, [])
    /* DialogComponent: ({ values, onSubmit, onCancel, ...props }) => {
      const form = useWatch({});
      const [nestedForm, setNestedForm] = useState({});

      useEffect(() => {
        setNestedForm(form);
      }, []);

      return (
        <Context.Provider value={{ nestedForm }}>
          <DialogForm
            title={'Tier form'}
            resolver={resolvers}
            values={values}
            onCancel={onCancel}
            {...props}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              <FormStepper
                steps={steps}
                initialValue={values}
                onSubmit={onSubmit}
              />
            </div>
          </DialogForm>
        </Context.Provider>
      ); */
  };
};

export default Roles;
