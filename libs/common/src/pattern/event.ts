export const SOCKET_EVENT = {
  NOTIFICATION: {
    NEW_REQUEST: 'new_request',
    ACCEPT_REQUEST: 'accept_request',
    REQUEST_ACCEPTED: 'request_accepted',
  },
  CHAT: {
    JOIN_CONVERSATION: 'join_conversation',
    LEAVE_CONVERSATION: 'leave_conversation',
    TYPING_STARTED: 'typing_started',
    TYPING_STOPPED: 'typing_stopped',
    NEW_MESSAGE: 'new_message',
    UPDATE_MESSAGE: 'update_message',
    DELETE_MESSAGE: 'delete_message',
  },
};
