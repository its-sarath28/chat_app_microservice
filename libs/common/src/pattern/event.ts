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
    UPDATE_CONVERSATION_LIST: 'update_conversation_list',
  },
  MESSAGE: {
    NEW_DIRECT_MESSAGE: 'new_direct_message',
    NEW_GROUP_MESSAGE: 'new_group_message',
    NEW_MESSAGE_NOTIFICATION: 'new_message_notification',
  },
  USER: {
    ONLINE_USERS: 'online_users',
  },
};

export const REDIS_PATTERN = {
  ONLINE_USERS: 'online_users',
};
