import React, { useMemo } from 'react';
import * as yup from 'yup';

import FormStepper from 'client/components/FormStepper';
import { DialogForm } from 'client/components/Dialogs';
import FormList from 'client/components/FormStepper/FormList';
import FlowWithFAB from 'client/components/Flows/FlowWithFAB';

import Steps from './Steps';

const Roles = () => {
  const STEP_ID = 'tiers';
  const { steps, defaultValues, resolvers } = Steps();

  return useMemo(
    () => ({
      id: STEP_ID,
      label: 'Tier Definition',
      content: FormList,
      DEFAULT_DATA: defaultValues,
      resolver: yup
        .array()
        .of(resolvers)
        .min(1)
        .required()
        .default([]),
      ListComponent: ({ list, handleCreate }) => (
        <div>
          <button onClick={handleCreate}>Add role</button>
          <div>{JSON.stringify(list)}</div>
        </div>
      ),
      DialogComponent: ({ values, onSubmit, onCancel, ...props }) => (
        <DialogForm
          title={'Role form'}
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
      )
    }),
    []
  );
};

export default Roles;
