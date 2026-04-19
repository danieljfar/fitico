let socketServer = null;

export function setSocketServer(server) {
  socketServer = server;
}

export function getSocketServer() {
  return socketServer;
}

export function emitSocketEvent(eventName, payload) {
  if (socketServer) {
    socketServer.emit(eventName, payload);
  }
}