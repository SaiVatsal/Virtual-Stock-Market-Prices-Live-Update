import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [userUpdates, setUserUpdates] = useState({});

  useEffect(() => {
    const socketIO = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
      transports: ['websocket']
    });

    setSocket(socketIO);

    socketIO.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketIO.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketIO.on('stockUpdate', (data) => {
      setStocks(data);
    });

    socketIO.on('userUpdate', (data) => {
      setUserUpdates(prev => ({
        ...prev,
        [data.userId]: data
      }));
    });

    return () => {
      socketIO.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, stocks, isConnected, userUpdates }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};