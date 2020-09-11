import React, { useMemo } from 'react';
import * as yup from 'yup';

import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers';

import FormStepper from 'client/components/FormStepper';
import { DialogForm } from 'client/components/Dialogs';
import FormStep from 'client/components/FormStepper/FormStep';
import FlowWithFAB from 'client/components/Flows/FlowWithFAB';

import Steps from './Steps';

const Roles = () => {
  const STEP_ID = 'roles';
  const { steps, defaultValues, resolvers } = Steps();

  const methods = useForm({
    mode: 'onBlur',
    defaultValues,
    resolver: yupResolver(resolvers)
  });

  const onSubmit = d => console.log('role data form', d);

  return useMemo(
    () => ({
      id: STEP_ID,
      label: 'Defining each role',
      content: FormStep,
      resolver: yup
        .array()
        .of(resolvers)
        .min(1)
        .required()
        .default([]),
      DialogComponent: props => (
        <DialogForm title={'Role form'} resolver={resolvers} {...props}>
          <FormProvider {...methods}>
            <FormStepper
              steps={steps}
              initialValue={defaultValues}
              onSubmit={onSubmit}
            />
          </FormProvider>
        </DialogForm>
      ),
      FormComponent: FlowWithFAB
    }),
    []
  );
};

export default Roles;
