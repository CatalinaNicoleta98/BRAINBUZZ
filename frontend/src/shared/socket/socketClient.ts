import { io } from "socket.io-client";
import { apiBaseUrl } from "../config/runtime";

const SOCKET_URL = apiBaseUrl;

export const socket = io(SOCKET_URL, {
  autoConnect: true,
});
