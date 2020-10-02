import React, { useEffect } from 'react';

import useGeneral from 'client/hooks/useGeneral';
import useApplication from 'client/hooks/useApplication';

import ListCards from 'client/components/List/ListCards';
import { ClusterCard } from 'client/components/Cards';

const ApplicationsList = () => {
  const { applications, getApplications } = useApplication();

  useEffect(() => {
    getApplications();
  }, []);

  return (
    <ListCards
      list={applications}
      CardComponent={ClusterCard}
      cardsProps={({ value }) => {
        console.log(value);
      }}
    />
  );
};

export default ApplicationsList;
