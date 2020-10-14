import React, { useCallback, useContext } from 'react';

import useListForm from 'client/hooks/useListForm';
import ListCards from 'client/components/List/ListCards';
import { SelectCard } from 'client/components/Cards';

import { STEP_ID as NETWORKING } from 'client/containers/ApplicationsTemplates/Create/Steps/Networking';
import { Context } from 'client/containers/ApplicationsTemplates/Create/Steps/Tiers';
import { STEP_FORM_SCHEMA } from './schema';

export const STEP_ID = 'networks';

const Networks = () => ({
  id: STEP_ID,
  label: 'Networks',
  resolver: STEP_FORM_SCHEMA,
  content: useCallback(({ data, setFormData }) => {
    const { nestedForm: list } = useContext(Context);
    const { handleSelect, handleUnselect } = useListForm({
      key: STEP_ID,
      multiple: true,
      setList: setFormData
    });

    return (
      <ListCards
        list={list[NETWORKING]}
        CardComponent={SelectCard}
        cardsProps={({ value: { id, name } }) => ({
          ID: id,
          NAME: name,
          isSelected: data?.some(selected => selected === id),
          handleSelect: () => handleSelect(id),
          handleUnselect: () => handleUnselect(id)
        })}
      />
    );
  }, [])
});

export default Networks;
