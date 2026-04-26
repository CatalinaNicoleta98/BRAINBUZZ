const HOST_ROOM_KEY = "brainbuzz_host_room";
const PLAYER_SESSION_KEY = "brainbuzz_player_session";

export function saveHostRoom(roomPin: string) {
  localStorage.setItem(HOST_ROOM_KEY, roomPin);
}

export function getHostRoom() {
  return localStorage.getItem(HOST_ROOM_KEY);
}

export function savePlayerSession(session: { roomPin: string; playerId: string; displayName: string; avatarId: string }) {
  localStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify(session));
}

export function getPlayerSession() {
  const raw = localStorage.getItem(PLAYER_SESSION_KEY);
  return raw ? (JSON.parse(raw) as { roomPin: string; playerId: string; displayName: string; avatarId: string }) : null;
}
