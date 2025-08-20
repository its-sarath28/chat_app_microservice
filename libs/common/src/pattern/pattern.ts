export const PATTERN = {
  AUTH: {
    LOGIN: { cmd: 'login' },
    REGISTER: { cmd: 'register' },
    REFRESH_TOKEN: { cmd: 'refresh_token' },
  },
  USER: {
    GET_PROFILE: { cmd: 'get_profile' },
    CREATE_USER: { cmd: 'create_user' },
    TOGGLE_BLOCK: { cmd: 'toggle_block' },
    FIND_BY_EMAIL: { cmd: 'find_by_email' },
    GET_BLOCK_LIST: { cmd: 'get_block_list' },
    UPDATE_PROFILE: { cmd: 'update_profile' },
    GET_REFRESH_TOKEN: { cmd: 'get_refresh_token' },
    UPDATE_REFRESH_TOKEN: { cmd: 'update_refresh_token' },
  },
  CHAT: {
    GET_CONVERSATION: { cmd: 'get_conversation' },
    CREATE_CONVERSATION: { cmd: 'create_conversation' },
    GET_ALL_CONVERSATIONS: { cmd: 'get_all_conversations' },
  },
};
