export const PATTERN = {
  AUTH: {
    LOGIN: { cmd: 'login' },
    REGISTER: { cmd: 'register' },
    REFRESH_TOKEN: { cmd: 'refresh_token' },
  },
  USER: {
    FIND_BY_ID: { cmd: 'find_by_id' },
    GET_PROFILE: { cmd: 'get_profile' },
    CREATE_USER: { cmd: 'create_user' },
    FIND_BY_EMAIL: { cmd: 'find_by_email' },
    UPDATE_PROFILE: { cmd: 'update_profile' },
    GET_REFRESH_TOKEN: { cmd: 'get_refresh_token' },
    UPDATE_REFRESH_TOKEN: { cmd: 'update_refresh_token' },
  },
};
