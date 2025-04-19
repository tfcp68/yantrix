import './App.css'
import { MainView } from './views/MainView';

function App() {
  console.log(import.meta.env.MODE);
  return (
      <MainView />
  )
}

export default App
