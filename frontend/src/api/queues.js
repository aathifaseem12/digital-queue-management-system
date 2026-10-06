import { apiGet, apiPost } from "./client";
const serviceView = s => ({ ...s, queueCode: s.code, people: s.peopleWaiting, waiting: s.estimatedWaitMinutes,
 average: s.averageWaitMinutes });
export async function loadUserDashboard() {
 const [services, queue] = await Promise.all([apiGet("/services"), apiGet("/queues/me")]);
 const list = services.map(serviceView);
 return { services: list.map(s => ({ ...s, status: s.status[0] + s.status.slice(1).toLowerCase() })),
  currentQueue: queue ? { ...queue, name: queue.serviceName, queueNumber: queue.ticketNumber, people: queue.peopleAhead,
   waiting: queue.estimatedWaitMinutes, icon: list.find(s => s.id === queue.serviceId)?.icon || "◎" } : null };
}
export async function loadAdminDashboard() {
 const [services, queue, stats] = await Promise.all([apiGet("/admin/services"), apiGet("/admin/queues"), apiGet("/admin/stats")]);
 return { services: services.map(s => ({ ...serviceView(s), waiting: s.peopleWaiting })),
  queue: queue.map(q => ({ ...q, waiting: q.waitingMinutes })), stats };
}
export const joinQueue = serviceId => apiPost("/queues/join", { serviceId });
export const leaveQueue = () => apiPost("/queues/leave");
export const callNext = () => apiPost("/admin/queues/call-next");
export const completeCustomer = id => apiPost("/admin/queues/" + id + "/complete");
export const toggleService = id => apiPost("/admin/services/" + id + "/toggle");
export const createService = service => apiPost("/admin/services", service);
