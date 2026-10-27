let io = null;

export function setSocketIO(socketIO) {
  io = socketIO;
}

export function getSocketIO() {
  return io;
}

export function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
}

export function emitToRide(rideId, event, payload) {
  if (!io || !rideId) return;
  io.to(`ride:${rideId}`).emit(event, payload);
}

export function emitToAll(event, payload) {
  if (!io) return;
  io.emit(event, payload);
}