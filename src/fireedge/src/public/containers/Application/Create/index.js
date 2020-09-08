import React from 'react';

import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers';

import FormStepper from 'client/components/FormStepper';
import Steps from 'client/containers/Application/Create/steps';
import { Container } from '@material-ui/core';

function ApplicationCreate() {
  const { steps, defaultValues } = Steps();
  const methods = useForm({
    mode: 'onBlur',
    defaultValues
  });

  const onSubmit = formData => console.log('submit', formData);

  return (
    <Container disableGutters>
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
