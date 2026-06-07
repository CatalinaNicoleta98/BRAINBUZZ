const HOST_ROOM_KEY = "brainbuzz_host_room";
const PLAYER_SESSION_KEY = "brainbuzz_player_session";

interface HostRoomSession {
  roomPin: string;
  hostAuthToken: string;
}

export function saveHostRoom(session: HostRoomSession) {
  localStorage.setItem(HOST_ROOM_KEY, JSON.stringify(session));
}

export function getHostRoom(): HostRoomSession | null {
  const raw = localStorage.getItem(HOST_ROOM_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<HostRoomSession>;
    if (parsed.roomPin && parsed.hostAuthToken) {
      return { roomPin: parsed.roomPin, hostAuthToken: parsed.hostAuthToken };
    }
  } catch {
    return { roomPin: raw, hostAuthToken: "" };
  }

  return null;
}

export function clearHostRoom() {
  localStorage.removeItem(HOST_ROOM_KEY);
}

export function savePlayerSession(session: { roomPin: string; playerId: string; displayName: string; avatarId: string }) {
  localStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify(session));
}

export function getPlayerSession() {
  const raw = localStorage.getItem(PLAYER_SESSION_KEY);
  return raw ? (JSON.parse(raw) as { roomPin: string; playerId: string; displayName: string; avatarId: string }) : null;
}

export function clearPlayerSession() {
  localStorage.removeItem(PLAYER_SESSION_KEY);
}
