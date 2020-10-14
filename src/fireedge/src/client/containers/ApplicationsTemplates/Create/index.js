import React, { useEffect } from 'react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { Container } from '@material-ui/core';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers';

import FormStepper from 'client/components/FormStepper';
import Steps from 'client/containers/ApplicationsTemplates/Create/Steps';

import { PATH } from 'client/router/endpoints';
import useFetch from 'client/hooks/useFetch';
import useApplication from 'client/hooks/useApplication';
import mapApplicationToForm from 'client/utils/parser/toApplicationForm';
import mapFormToApplication from 'client/utils/parser/toApplicationTemplate';

function ApplicationCreate() {
  const history = useHistory();
  const { id } = useParams();
  const { steps, defaultValues, resolvers } = Steps();
  const {
    getApplicationTemplate,
    createApplicationTemplate,
    updateApplicationTemplate
  } = useApplication();
  const { data, fetchRequest, loading, error } = useFetch(
    getApplicationTemplate
  );

  const methods = useForm({
    mode: 'onSubmit',
    defaultValues,
    resolver: yupResolver(resolvers)
  });

  const onSubmit = formData => {
    const application = mapFormToApplication(formData);

    if (id)
      updateApplicationTemplate({ id, data: application }).then(
        res => res && history.push(PATH.APPLICATION.LIST)
      );
    else
      createApplicationTemplate({ data: application }).then(
        res => res && history.push(PATH.APPLICATION.LIST)
      );
  };

  useEffect(() => {
    try {
      if (id) {
        const idNumber = parseInt(id, 10);
        if (idNumber < 0) throw new Error();

        fetchRequest({ id: idNumber });
      }
    } catch {
      // show error
      history.push(PATH.DASHBOARD);
    }
  }, [id]);

  useEffect(() => {
    const formData = data ? mapApplicationToForm(data) : {};
    methods.reset(resolvers.cast(formData), { errors: false });
  }, [data]);

  if (error) {
    return <Redirect to={PATH.DASHBOARD} />;
  }

  return (
    <Container
      disableGutters
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {loading ? (
        <div>is loading...</div>
      ) : (
        <FormProvider {...methods}>
          <FormStepper steps={steps} schema={resolvers} onSubmit={onSubmit} />
        </FormProvider>
      )}
    </Container>
  );
}

ApplicationCreate.propTypes = {};

ApplicationCreate.defaultProps = {};

export default ApplicationCreate;
