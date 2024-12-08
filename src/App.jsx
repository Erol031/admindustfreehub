import React, {useEffect, useState} from 'react';
import { auth, db } from './firebase/firebase';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx'; // Adjusted import
import Panel from './pages/Panel.jsx';
import Services from './pages/Services.jsx';
import Bookings from './pages/Bookings.jsx';

function App() {

  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login/>} />
          <Route path="/panel" element={<Panel user={user}/>} />
          <Route path="/services" element ={<Services user={user}/>}></Route>
          <Route path="/bookings" element ={<Bookings user={user}/>}></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
