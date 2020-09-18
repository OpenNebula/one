import React, { useCallback, useContext } from 'react';

import useListForm from 'client/hooks/useListForm';
import ListCards from 'client/components/List/ListCards';
import { SelectCard } from 'client/components/Cards';

import { STEP_ID as NETWORKING } from 'client/containers/Application/Create/Steps/Networking';
import { Context } from 'client/containers/Application/Create/Steps/Roles';
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
        cardsProps={({ value, index }) => ({
          ID: String(index),
          NAME: value?.name,
          isSelected: data?.some(selected => selected === index),
          handleSelect: () => handleSelect(index),
          handleUnselect: () => handleUnselect(index)
        })}
      />
    );
  }, [])
});

export default Networks;
