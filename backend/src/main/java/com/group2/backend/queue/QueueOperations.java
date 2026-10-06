package com.group2.backend.queue;
import java.time.*;
import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class QueueOperations {
 private static final List<String> ACTIVE = List.of("WAITING", "SERVING");
 private final QueueServiceRepository services;
 private final QueueEntryRepository entries;
 public QueueOperations(QueueServiceRepository services, QueueEntryRepository entries) {
  this.services = services; this.entries = entries;
 }
 private void lock() { services.lockServices(); }
 private ResponseStatusException error(HttpStatus status, String message) { return new ResponseStatusException(status, message); }
 private Instant dayStart() { return LocalDate.now(ZoneId.of("Asia/Colombo")).atStartOfDay(ZoneId.of("Asia/Colombo")).toInstant(); }
 @Transactional(readOnly=true)
 public List<ServiceView> listUserServices() { return listAdminServices(); }
 @Transactional(readOnly=true)
 public List<ServiceView> listAdminServices() {
  return services.findAllByOrderByIdAsc().stream().map(this::toServiceView).toList();
 }
 @Transactional(readOnly=true)
 public Optional<QueueView> currentQueue(String email) { return findActiveQueue(email).map(this::toQueueView); }
 public QueueView joinQueue(String email, Long serviceId) {
  lock();
  if (findActiveQueue(email).isPresent()) throw error(HttpStatus.CONFLICT, "You already have an active queue.");
  var service = service(serviceId);
  if ("CLOSED".equals(service.getStatus())) throw error(HttpStatus.CONFLICT, "This queue service is currently closed.");
  var entry = new QueueEntry();
  entry.setService(service); entry.setUserEmail(normalize(email)); entry.setActiveUserEmail(normalize(email));
  entry.setStatus("WAITING");
  try { entries.saveAndFlush(entry); }
  catch (DataIntegrityViolationException ex) { throw error(HttpStatus.CONFLICT, "You already have an active queue."); }
  entry.setTicketNumber(service.getCode() + "-" + entry.getId());
  entries.flush();
  return toQueueView(entry);
 }
 public QueueView leaveQueue(String email) {
  lock();
  var entry = findActiveQueue(email).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "You do not have an active queue."));
  entry.setStatus("CANCELLED"); entry.setActiveUserEmail(null); entry.setCompletedAt(Instant.now());
  entries.flush();
  return toQueueView(entry);
 }
 @Transactional(readOnly=true)
 public List<AdminQueueView> adminQueue() {
  return entries.findAllByOrderByJoinedAtAsc().stream().map(this::toAdminQueueView).toList();
 }
 public Optional<AdminQueueView> callNext() {
  lock();
  if (!entries.findByStatusOrderByJoinedAtAsc("SERVING").isEmpty())
   throw error(HttpStatus.CONFLICT, "Complete the current customer before calling next.");
  var next = entries.findByStatusOrderByJoinedAtAsc("WAITING").stream()
   .filter(q -> !"CLOSED".equals(q.getService().getStatus())).min(Comparator.comparing(QueueEntry::getId));
  if (next.isEmpty()) return Optional.empty();
  var entry = next.get();
  entry.setStatus("SERVING"); entry.setStartedAt(Instant.now()); entries.flush();
  return Optional.of(toAdminQueueView(entry));
 }
 public AdminQueueView completeQueueEntry(Long id) {
  lock();
  var entry = entries.findById(id).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Queue entry not found."));
  if ("COMPLETED".equals(entry.getStatus())) return toAdminQueueView(entry);
  if (!"SERVING".equals(entry.getStatus())) throw error(HttpStatus.CONFLICT, "Only a serving customer can be completed.");
  entry.setStatus("COMPLETED"); entry.setActiveUserEmail(null); entry.setCompletedAt(Instant.now()); entries.flush();
  return toAdminQueueView(entry);
 }
 public ServiceView createService(String code, String name, String description, String category, Integer averageWaitMinutes) {
  lock();
  var normalized = code.trim().toUpperCase(Locale.ROOT);
  if (services.findByCodeIgnoreCase(normalized).isPresent()) throw error(HttpStatus.CONFLICT, "Queue service code already exists.");
  if (name.trim().isEmpty() || description.trim().isEmpty() || category.trim().isEmpty())
   throw error(HttpStatus.BAD_REQUEST, "Service details are required.");
  var service = new QueueServiceEntity();
  service.setCode(normalized); service.setName(name.trim()); service.setDescription(description.trim());
  service.setCategory(category.trim()); service.setAverageWaitMinutes(averageWaitMinutes); service.setStatus("OPEN");
  try { services.saveAndFlush(service); }
  catch (DataIntegrityViolationException ex) { throw error(HttpStatus.CONFLICT, "Queue service code already exists."); }
  return toServiceView(service);
 }
 public ServiceView toggleService(Long id) {
  lock();
  var service = service(id);
  service.setStatus("CLOSED".equals(service.getStatus()) ? "OPEN" : "CLOSED"); services.flush();
  return toServiceView(service);
 }
 @Transactional(readOnly=true)
 public StatsView stats() {
  var waiting = entries.findByStatusOrderByJoinedAtAsc("WAITING");
  int average = waiting.isEmpty() ? 0 : (int)Math.round(waiting.stream().mapToLong(q -> toQueueView(q).estimatedWaitMinutes()).average().orElse(0));
  return new StatsView(waiting.size(), entries.countByStatusAndCompletedAtGreaterThanEqual("COMPLETED", dayStart()),
   average, services.findAllByOrderByIdAsc().stream().filter(s -> !"CLOSED".equals(s.getStatus())).count());
 }
 private QueueServiceEntity service(Long id) {
  return services.findById(id).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Queue service not found."));
 }
 private Optional<QueueEntry> findActiveQueue(String email) {
  return entries.findByUserEmailAndStatusInOrderByJoinedAtDesc(normalize(email), ACTIVE).stream().findFirst();
 }
 private ServiceView toServiceView(QueueServiceEntity service) {
  long waiting = entries.countActiveForService(service.getId(), List.of("WAITING"));
  long active = entries.countActiveForService(service.getId(), ACTIVE);
  long served = entries.countByServiceIdAndStatusAndCompletedAtGreaterThanEqual(service.getId(), "COMPLETED", dayStart());
  return new ServiceView(service.getId(), service.getCode(), service.getName(), service.getDescription(), service.getCategory(),
   service.getStatus(), waiting, active * service.getAverageWaitMinutes(), iconFor(service.getCategory()), service.getAverageWaitMinutes(), served);
 }
 private QueueView toQueueView(QueueEntry entry) {
  boolean waiting = "WAITING".equals(entry.getStatus());
  long ahead = waiting ? entries.countPeopleAhead(entry.getService().getId(), ACTIVE, entry.getId()) : 0;
  return new QueueView(entry.getId(), entry.getTicketNumber(), entry.getService().getId(), entry.getService().getName(),
   entry.getStatus(), waiting ? ahead + 1 : 0, ahead, ahead * entry.getService().getAverageWaitMinutes(), entry.getUserEmail(), entry.getJoinedAt());
 }
 private AdminQueueView toAdminQueueView(QueueEntry entry) {
  Instant end = entry.getStartedAt() != null ? entry.getStartedAt() : entry.getCompletedAt() != null ? entry.getCompletedAt() : Instant.now();
  long minutes = Math.max(0, Duration.between(entry.getJoinedAt(), end).toMinutes());
  return new AdminQueueView(entry.getId(), entry.getTicketNumber(), entry.getUserEmail(), entry.getService().getName(), minutes, entry.getStatus());
 }
 private String normalize(String email) { return email.trim().toLowerCase(Locale.ROOT); }
 private String iconFor(String category) {
  return switch(category.toLowerCase(Locale.ROOT)) {
   case "documents" -> "▤"; case "payments" -> "◈"; case "registration" -> "◇"; case "priority" -> "✦"; default -> "◎";
  };
 }
 public record ServiceView(Long id, String code, String name, String description, String category, String status,
  long peopleWaiting, long estimatedWaitMinutes, String icon, int averageWaitMinutes, long served) {}
 public record QueueView(Long id, String ticketNumber, Long serviceId, String serviceName, String status,
  long position, long peopleAhead, long estimatedWaitMinutes, String userEmail, Instant joinedAt) {}
 public record AdminQueueView(Long id, String ticket, String customer, String service, long waitingMinutes, String status) {}
 public record StatsView(long waiting, long served, int averageWait, long activeServices) {}
}
