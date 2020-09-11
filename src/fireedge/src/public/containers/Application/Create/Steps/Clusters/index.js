import { useMemo } from 'react';

import useOpennebula from 'client/hooks/useOpennebula';

import { ClusterCard } from 'client/components/Cards';
import FormListSelect from 'client/components/FormStepper/FormListSelect';

import { STEP_FORM_SCHEMA } from './schema';

const Clusters = () => {
  const STEP_ID = 'clusters';
  const { clusters, getClusters } = useOpennebula();

  return useMemo(
    () => ({
      id: STEP_ID,
      label: 'Where will it run?',
      content: FormListSelect,
      resolver: STEP_FORM_SCHEMA,
      onlyOneSelect: true,
      preRender: getClusters,
      list: clusters,
      ItemComponent: ClusterCard
    }),
    [getClusters, clusters]
  );
};

export default Clusters;
