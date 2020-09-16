import React, { useState, useEffect, createElement } from 'react';
import PropTypes from 'prop-types';

import { Fade, Button, IconButton } from '@material-ui/core';
import BackIcon from '@material-ui/icons/ArrowBackIosOutlined';

function ProcessScreen({ screens, id, values, setFormData }) {
  const [process, setProcess] = useState(undefined);

  useEffect(() => {
    const keyValues = Object.keys(values);

    if (keyValues.length > 0) {
      const currentScreen = keyValues[0];
      const index = screens.findIndex(scr => scr.id === currentScreen);
      if (index !== -1) setProcess(index);
    }
  }, []);

  const handleSetData = data =>
    setFormData(prevData => ({
      ...prevData,
      [id]: data ? { [screens[process]?.id]: data } : undefined
    }));

  const handleBack = () => {
    setProcess(undefined);
    handleSetData();
  };

  return (
    <>
      {process !== undefined ? (
        createElement(screens[process]?.screen, {
          backButton: (
            <IconButton onClick={handleBack}>
              <BackIcon />
            </IconButton>
          ),
          handleSetData,
          currentValue: values[screens[process]?.id]
        })
      ) : (
        <div style={{ flexGrow: 1 }}>
          <div
            style={{
              height: '100%',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            {screens?.map(({ id, button }, index) => (
              <Fade in timeout={500} key={`option-${id}`}>
                <Button
                  variant="contained"
                  style={{ backgroundColor: '#fff' }}
                  onClick={() => setProcess(index)}
                >
                  {button}
                </Button>
              </Fade>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

ProcessScreen.propTypes = {
  screens: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      button: PropTypes.element,
      screen: PropTypes.func
    })
  )
};

ProcessScreen.defaultProps = {
  screens: []
};

export default ProcessScreen;
