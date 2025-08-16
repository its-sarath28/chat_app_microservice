export const PATTERN = {
  AUTH: {
    LOGIN: { cmd: 'login' },
    REGISTER: { cmd: 'register' },
  },
  USER: {
    FIND_BY_ID: { cmd: 'find_by_id' },
    CREATE_USER: { cmd: 'create_user' },
    FIND_BY_EMAIL: { cmd: 'find_by_email' },
    UPDATE_REFRESH_TOKEN: { cmd: 'update_refresh_token' },
  },
};
