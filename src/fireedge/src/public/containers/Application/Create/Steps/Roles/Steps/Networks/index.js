import React, { useCallback, useContext } from 'react';

import useListForm from 'client/hooks/useListForm';
import ListCards from 'client/components/List/ListCards';

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

    console.log('list', list);

    return (
      <ListCards
        list={list[NETWORKING]}
        CardComponent={() => <h1>hi</h1>}
        cardsProps={({ value }) => {
          const { ID } = value;

          return {
            isSelected: data?.some(selected => selected === ID),
            handleSelect: () => handleSelect(ID),
            handleUnselect: () => handleUnselect(ID)
          };
        }}
      />
    );
  }, [])
});

export default Networks;
