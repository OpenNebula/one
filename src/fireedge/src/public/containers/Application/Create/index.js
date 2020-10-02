import React, { useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { Container } from '@material-ui/core';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers';

import FormStepper from 'client/components/FormStepper';
import Steps from 'client/containers/Application/Create/Steps';

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
      updateApplicationTemplate({ id, data: application }).then(() =>
        history.push(PATH.APPLICATION.DEPLOY)
      );
    else
      createApplicationTemplate({ data: application }).then(() =>
        history.push(PATH.APPLICATION.DEPLOY)
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
    methods.reset({ ...defaultValues, ...formData }, { errors: false });
  }, [data]);

  return (
    <Container
      disableGutters
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {error && <div>error!</div>}
      {!error && loading ? (
        <div>is loading...</div>
      ) : (
        <FormProvider {...methods}>
          <FormStepper steps={steps} onSubmit={onSubmit} />
        </FormProvider>
      )}
    </Container>
  );
}

ApplicationCreate.propTypes = {};

ApplicationCreate.defaultProps = {};

export default ApplicationCreate;
