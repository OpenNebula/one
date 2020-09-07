import React, { useEffect } from 'react';

import { useForm, FormProvider } from 'react-hook-form';

import FormStepper from 'client/components/FormStepper';
import Steps from 'client/containers/Application/Create/steps';
import useOpennebula from 'client/hooks/useOpennebula';

const INITIAL_VALUE = {
  networks: [],
  roles: []
};

function ApplicationCreate() {
  const { getVNetworks, getVNetworksTemplates, getTemplates } = useOpennebula();
  const methods = useForm({
    mode: 'onBlur'
  });
  const { watch, errors } = methods;

  useEffect(() => {
    getVNetworks();
    getVNetworksTemplates();
    getTemplates();
  }, []);

  useEffect(() => {
    // console.log('FORM CONTEXT', watch(), errors);
  }, [watch, errors]);

  const onSubmit = formData => console.log('submit', formData);

  return (
    <FormProvider {...methods}>
      <FormStepper
        steps={Steps}
        initialValue={INITIAL_VALUE}
        onSubmit={onSubmit}
      />
    </FormProvider>
  );
}

ApplicationCreate.propTypes = {};

ApplicationCreate.defaultProps = {};

export default ApplicationCreate;
