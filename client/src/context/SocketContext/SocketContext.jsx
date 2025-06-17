import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (currentUser && !socket) {
      const newSocket = io("http://localhost:5000", {
        query: { userId: currentUser.id },
      });

      newSocket.on("connect", () => {
        console.log("✅ Socket connected:", newSocket.id);
      });

      newSocket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [currentUser]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
