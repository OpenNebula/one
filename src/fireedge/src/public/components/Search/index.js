import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { TextField, Box } from '@material-ui/core';

const Search = ({
  list,
  maxResults,
  filterSearch,
  renderResult,
  ResultBoxProps
}) => {
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(list);

  useEffect(() => {
    setResult(list?.filter(item => filterSearch(item, search)));
  }, [search, list]);

  const handleChange = event => setSearch(event.target.value);

  return (
    <>
      <TextField
        type="search"
        value={search}
        onChange={handleChange}
        fullWidth
        placeholder="Search..."
      />
      <Box {...ResultBoxProps}>
        {result?.slice(0, maxResults).map(renderResult)}
      </Box>
    </>
  );
};

Search.propTypes = {
  list: PropTypes.arrayOf(PropTypes.object).isRequired,
  maxResults: PropTypes.number,
  filterSearch: PropTypes.func,
  renderResult: PropTypes.func,
  ResultBoxProps: PropTypes.objectOf(PropTypes.object)
};

Search.defaultProps = {
  list: [],
  maxResults: undefined,
  filterSearch: (item, search) => item.toLowerCase().includes(search),
  renderResult: item => item,
  ResultBoxProps: {}
};

export default Search;
