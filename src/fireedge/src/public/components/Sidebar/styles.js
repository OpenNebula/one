import { makeStyles } from '@material-ui/core';

export default makeStyles(theme => ({
  menu: {
    overflow: 'auto',
    textTransform: 'capitalize',
    color: 'transparent',
    transition: 'color 0.3s',
    '&:hover': {
      color: theme.palette.primary.light
    },
    '&::-webkit-scrollbar': {
      width: 14
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundClip: 'content-box',
      border: '4px solid transparent',
      borderRadius: 7,
      boxShadow: 'inset 0 0 0 10px'
    },
    '&::-webkit-scrollbar-button': {
      width: 0,
      height: 0,
      display: 'none'
    },
    '&::-webkit-scrollbar-corner': {
      backgroundColor: 'transparent'
    }
  },
  list: {
    color: theme.palette.common.black
  },
  logo: {
    padding: '1rem 2rem'
  },
  img: {
    width: '100%'
  }
}));
