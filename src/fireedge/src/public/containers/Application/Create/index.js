import React from 'react';

import { Container } from '@material-ui/core';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers';

import FormStepper from 'client/components/FormStepper';
import Steps from 'client/containers/Application/Create/Steps';

function ApplicationCreate() {
  const { steps, defaultValues, resolvers } = Steps();

  const methods = useForm({
    mode: 'onBlur',
    defaultValues,
    resolver: yupResolver(resolvers)
  });

  const onSubmit = formData => console.log('submit', formData, methods.errors);

  return (
    <Container
      disableGutters
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <FormProvider {...methods}>
        <FormStepper
          steps={steps}
          initialValue={defaultValues}
          onSubmit={onSubmit}
        />
      </FormProvider>
    </Container>
  );
}

ApplicationCreate.propTypes = {};

ApplicationCreate.defaultProps = {};

export default ApplicationCreate;
