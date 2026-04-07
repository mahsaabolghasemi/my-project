/**
 * Whitelist users for client-side login (Phase 1).
 * Used in the browser via window.MINISHOP_USERS_WHITELIST.
 * Node: module.exports for tests or future bundlers.
 */

const users = [
  {
    id: 1,
    username: 'tina',
    password: '1234',
    name: 'Tina',
  },
  {
    id: 2,
    username: 'ali',
    password: '1234',
    name: 'Ali',
  },
  {
    id: 3,
    username: 'sara',
    password: '1234',
    name: 'Sara',
  },
  {
    id: 4,
    username: 'reza',
    password: '1234',
    name: 'Reza',
  },
  {
    id: 5,
    username: 'mina',
    password: '1234',
    name: 'Mina',
  },
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = users;
}

if (typeof window !== 'undefined') {
  window.MINISHOP_USERS_WHITELIST = users;
}
