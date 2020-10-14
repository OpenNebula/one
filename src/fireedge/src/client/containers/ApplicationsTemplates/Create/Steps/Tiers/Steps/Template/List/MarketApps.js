import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import useOpennebula from 'client/hooks/useOpennebula';
import Search from 'client/components/Search';
import { SelectCard } from 'client/components/Cards';

const sortByID = (a, b) => a.ID - b.ID;

const ListMarketApp = ({ backButton, currentValue, handleSetData }) => {
  const { apps, getMarketApps } = useOpennebula();

  useEffect(() => {
    getMarketApps();
  }, []);

  const handleSelect = index => handleSetData(index);
  const handleUnselect = () => handleSetData();

  const renderApp = app => (
    <SelectCard
      key={`app-${app.ID}`}
      isSelected={app.ID === String(currentValue)}
      handleSelect={handleSelect}
      handleUnselect={handleUnselect}
      {...app}
    />
  );

  return (
    <Search
      list={apps?.sort(sortByID)}
      listOptions={{ shouldSort: true, sortFn: sortByID, keys: ['NAME'] }}
      renderResult={renderApp}
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

ListMarketApp.propTypes = {
  backButton: PropTypes.node,
  currentValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  handleSetData: PropTypes.func
};

ListMarketApp.defaultProps = {
  backButton: null,
  currentValue: undefined,
  handleSetData: () => undefined
};

export default ListMarketApp;
