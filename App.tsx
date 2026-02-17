import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Events } from './components/Events';
import { Resources } from './components/Resources';
import { Clubs } from './components/Clubs';
import { Chat } from './components/Chat';
import { Login } from './components/Login';
import { useStore } from './services/store';
import { UserRole } from './types';

const App: React.FC = () => {
  const store = useStore();

  if (!store.user) {
    return <Login onLogin={(role) => store.login('demo@uni.edu', role)} />;
  }

  const isStudent = store.user.role === UserRole.STUDENT;

  return (
    <HashRouter>
      <Layout user={store.user} onLogout={store.logout}>
        <Routes>
          <Route path="/" element={
             // Redirect students to Events, show Dashboard for others
             isStudent 
              ? <Navigate to="/events" replace /> 
              : <Dashboard events={store.events} users={store.users} resources={store.resources} />
          } />
          
          <Route path="/events" element={
            <Events 
              events={store.events} 
              resources={store.resources} 
              user={store.user} 
              onAddEvent={store.addEvent} 
              onUpdateStatus={store.updateEventStatus} 
            />
          } />
          
          <Route path="/resources" element={
            // Prevent access to Resources for students
            isStudent ? <Navigate to="/events" replace /> :
            <Resources 
              resources={store.resources} 
              bookings={store.bookings} 
              events={store.events}
              user={store.user} 
              onBook={store.addBooking}
              onAddEvent={store.addEvent}
              onAddResource={store.addResource}
              onRemoveResource={store.removeResource}
            />
          } />
          
          <Route path="/clubs" element={<Clubs clubs={store.clubs} />} />
          
          <Route path="/chat" element={
            <Chat 
              messages={store.messages} 
              user={store.user} 
              events={store.events} 
              onSend={store.sendMessage} 
            />
          } />
          
          <Route path="*" element={<Navigate to={isStudent ? "/events" : "/"} />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;