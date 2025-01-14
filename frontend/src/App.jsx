
import { useState } from "react";
import "./App.css"
import io from "socket.io-client"


const socket = io("http://localhost:5000");

const App = () => {

  const [joined , setJoined] = useState(false);

  
    if (!joined) {
     return <div>App not joined</div>
    }
    else{
       return<div>App</div>
    }
  
  
}

export default App  