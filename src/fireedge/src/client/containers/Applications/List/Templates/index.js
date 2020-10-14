import React, { useEffect } from 'react';

import { useHistory } from 'react-router-dom';
import { Box, LinearProgress } from '@material-ui/core';
import { Alert } from '@material-ui/lab';

import useApplication from 'client/hooks/useApplication';
import useFetch from 'client/hooks/useFetch';

import ListCards from 'client/components/List/ListCards';
import { ApplicationTemplateCard } from 'client/components/Cards';
import { PATH } from 'client/router/endpoints';

import { Tr } from 'client/components/HOC';

const ApplicationsTemplatesList = () => {
  const history = useHistory();
  const { applicationsTemplates, getApplicationsTemplates } = useApplication();
  const { fetchRequest, loading, error } = useFetch(getApplicationsTemplates);

  useEffect(() => {
    fetchRequest();
  }, []);

  if (error) {
    return (
      <Box pt={3} display="flex" justifyContent="center">
        <Alert severity="error" icon={false} variant="filled">
          {Tr('Cannot connect to OneFlow server')}
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box p={3}>
      <ListCards
        list={applicationsTemplates}
        handleCreate={() => history.push(PATH.APPLICATION_TEMPLATE.CREATE)}
        CardComponent={ApplicationTemplateCard}
        cardsProps={({ value: { ID } }) => ({
          handleEdit: () =>
            history.push(PATH.APPLICATION_TEMPLATE.EDIT.replace(':id', ID)),
          handleDeploy: undefined,
          handleRemove: undefined
        })}
      />
    </Box>
  );
};

export default ApplicationsTemplatesList;
