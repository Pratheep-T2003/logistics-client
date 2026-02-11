import api from './axios';

export const getUsers = () => api.get('/users');
export const registerUser = (userData) => api.post('/users/register', userData);
export const updateUser = (id, userData) => api.put(`/users/${id}`, userData);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const login = (identifier, password) => {
    const isEmail = identifier.includes('@');
    const data = isEmail ? { email: identifier, password } : { driverId: identifier, password };
    return api.post('/users/login', data);
};
