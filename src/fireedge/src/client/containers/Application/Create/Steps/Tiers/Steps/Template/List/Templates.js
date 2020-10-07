import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import useOpennebula from 'client/hooks/useOpennebula';
import Search from 'client/components/Search';
import { SelectCard } from 'client/components/Cards';

const sortByID = (a, b) => a.ID - b.ID;

const ListTemplates = ({ backButton, currentValue, handleSetData }) => {
  const { templates, getTemplates } = useOpennebula();

  useEffect(() => {
    getTemplates();
  }, []);

  const handleSelect = index => handleSetData(index);
  const handleUnselect = () => handleSetData();

  const renderTemplate = tmp => (
    <SelectCard
      key={`tmp-${tmp.ID}`}
      isSelected={tmp.ID === currentValue}
      handleSelect={handleSelect}
      handleUnselect={handleUnselect}
      {...tmp}
    />
  );

  return (
    <Search
      list={templates?.sort(sortByID)}
      listOptions={{ shouldSort: true, sortFn: sortByID, keys: ['NAME'] }}
      renderResult={renderTemplate}
      startAdornment={backButton}
      searchBoxProps={{
        style: {
          display: 'flex',
          padding: '1rem 0',
          gap: 10
        }
      }}
    />
  );
};

ListTemplates.propTypes = {
  backButton: PropTypes.node,
  currentValue: PropTypes.string,
  handleSetData: PropTypes.func
};

ListTemplates.defaultProps = {
  backButton: null,
  currentValue: undefined,
  handleSetData: () => undefined
};

export default ListTemplates;
