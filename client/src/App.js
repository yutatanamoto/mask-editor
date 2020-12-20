import logo from './logo.svg';
import './App.css';
import Canvas from './components/Canvas';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  root: {
    height: "100%",
    width: "100%",
  },
});

function App() {
  const classes = useStyles();
  return (
    <div className="App" classesname={classes.root}>
      <Canvas />
    </div>
  );
}

export default App;
