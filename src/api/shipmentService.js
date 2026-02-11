import api from './axios';

export const getShipments = () => api.get('/shipments');
export const createShipment = (data) => api.post('/shipments', data);
export const updateShipmentStatus = (id, status, note, assignedDriver) => api.patch(`/shipments/${id}/status`, { status, note, assignedDriver });
export const deleteShipment = (id) => api.delete(`/shipments/${id}`);
