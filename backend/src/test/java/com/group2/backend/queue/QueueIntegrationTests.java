package com.group2.backend.queue;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class QueueIntegrationTests {
 @Autowired QueueOperations operations;
 @Autowired QueueEntryRepository entries;
 @Autowired QueueServiceRepository services;
 @Autowired MockMvc mvc;
 @BeforeEach void clean() {
  entries.deleteAll();
  var all = services.findAllByOrderByIdAsc();
  for (var service : all) {
   if (service.getCode().startsWith("TST")) { services.delete(service); }
   else { service.setStatus("OPEN"); services.save(service); }
  }
 }
 Long serviceId() { return services.findAllByOrderByIdAsc().getFirst().getId(); }
 @Test void userCanJoinAndLeaveQueue() {
  var joined = operations.joinQueue("Member@test.com", serviceId());
  assertNotNull(joined.ticketNumber()); assertEquals(1, joined.position()); assertEquals(0, joined.estimatedWaitMinutes());
  assertEquals(joined.id(), operations.currentQueue("member@test.com").orElseThrow().id());
  assertEquals("CANCELLED", operations.leaveQueue("member@test.com").status());
  assertTrue(operations.currentQueue("member@test.com").isEmpty());
  assertNotEquals(joined.id(), operations.joinQueue("member@test.com", serviceId()).id());
 }
 @Test void userCannotJoinTwoActiveQueues() {
  operations.joinQueue("duplicate@test.com", serviceId());
  var failure = assertThrows(ResponseStatusException.class, () -> operations.joinQueue("duplicate@test.com", services.findAllByOrderByIdAsc().get(1).getId()));
  assertEquals(409, failure.getStatusCode().value()); assertEquals(1, entries.count());
 }
 @Test void positionUpdatesAndServingCustomerMustBeCompleted() {
  var first = operations.joinQueue("first@test.com", serviceId());
  var second = operations.joinQueue("second@test.com", serviceId());
  assertEquals(2, second.position()); assertEquals(1, second.peopleAhead());
  assertTrue(second.estimatedWaitMinutes() > 0);
  assertEquals(first.id(), operations.callNext().orElseThrow().id());
  assertEquals("SERVING", operations.currentQueue("first@test.com").orElseThrow().status());
  assertThrows(ResponseStatusException.class, () -> operations.callNext());
  assertThrows(ResponseStatusException.class, () -> operations.completeQueueEntry(second.id()));
  operations.completeQueueEntry(first.id());
  assertTrue(operations.currentQueue("first@test.com").isEmpty());
  assertEquals(1, operations.currentQueue("second@test.com").orElseThrow().position());
  assertEquals(second.id(), operations.callNext().orElseThrow().id());
  operations.completeQueueEntry(second.id());
  assertTrue(operations.callNext().isEmpty());
  assertEquals(2, operations.stats().served());
 }
 @Test void closedServiceBlocksJoiningAndCallingButReopens() {
  var joined = operations.joinQueue("first@test.com", serviceId());
  operations.toggleService(serviceId());
  assertThrows(ResponseStatusException.class, () -> operations.joinQueue("new@test.com", serviceId()));
  assertTrue(operations.callNext().isEmpty());
  assertTrue(operations.listUserServices().stream().anyMatch(s -> s.id().equals(serviceId()) && s.status().equals("CLOSED")));
  operations.toggleService(serviceId());
  assertEquals(joined.id(), operations.callNext().orElseThrow().id());
 }
 @Test void serviceCreationRejectsDuplicateAndStatsUseDatabase() {
  var created = operations.createService("tst1", "Test service", "Description", "General", 7);
  assertEquals("TST1", created.code());
  assertThrows(ResponseStatusException.class, () -> operations.createService("TST1", "Duplicate", "Description", "General", 7));
  operations.joinQueue("one@test.com", created.id());
  assertEquals(1, operations.stats().waiting());
  assertEquals(1, operations.listAdminServices().stream().filter(s -> s.id().equals(created.id())).findFirst().orElseThrow().peopleWaiting());
 }
 @Test void cancelledCustomerCannotBeCompleted() {
  var joined = operations.joinQueue("cancel@test.com", serviceId());
  operations.leaveQueue("cancel@test.com");
  assertEquals(409, assertThrows(ResponseStatusException.class, () -> operations.completeQueueEntry(joined.id())).getStatusCode().value());
 }
 @Test void concurrentJoinsCreateOnlyOneActiveTicket() throws Exception {
  var ids = services.findAllByOrderByIdAsc().stream().limit(2).map(QueueServiceEntity::getId).toList();
  try (var pool = Executors.newFixedThreadPool(2)) {
   var results = pool.invokeAll(ids.stream().<Callable<Integer>>map(id -> () -> {
    try { operations.joinQueue("race@test.com", id); return 200; }
    catch (ResponseStatusException ex) { return ex.getStatusCode().value(); }
   }).toList());
   var statuses = new HashSet<Integer>();
   for (var result : results) statuses.add(result.get());
   assertEquals(Set.of(200,409), statuses); assertEquals(1, entries.count());
  }
 }
 @Test void concurrentAdminsCannotCallTwoCustomers() throws Exception {
  operations.joinQueue("first@test.com", serviceId()); operations.joinQueue("second@test.com", serviceId());
  try (var pool = Executors.newFixedThreadPool(2)) {
   var results = pool.invokeAll(List.<Callable<Integer>>of(() -> callStatus(), () -> callStatus()));
   var statuses = new HashSet<Integer>();
   for (var result : results) statuses.add(result.get());
   assertEquals(Set.of(200,409), statuses);
   assertEquals(1, entries.findByStatusOrderByJoinedAtAsc("SERVING").size());
  }
 }
 int callStatus() {
  try { operations.callNext(); return 200; }
  catch (ResponseStatusException ex) { return ex.getStatusCode().value(); }
 }
 @Test void endpointsEnforceRolesCsrfValidationAndOwnership() throws Exception {
  mvc.perform(get("/api/services")).andExpect(status().isUnauthorized());
  mvc.perform(get("/api/admin/queues").with(user("user@test.com").roles("USER"))).andExpect(status().isForbidden());
  mvc.perform(post("/api/queues/join").with(user("user@test.com")).contentType("application/json").content("{\"serviceId\":" + serviceId() + "}")).andExpect(status().isForbidden());
  mvc.perform(post("/api/queues/join").with(user("user@test.com")).with(csrf()).contentType("application/json").content("{}")).andExpect(status().isBadRequest());
  mvc.perform(post("/api/queues/join").with(user("user@test.com")).with(csrf()).contentType("application/json").content("{\"serviceId\":" + serviceId() + "}"))
   .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("WAITING"));
  mvc.perform(get("/api/queues/me").with(user("other@test.com"))).andExpect(status().isNoContent());
  mvc.perform(post("/api/queues/leave").with(user("other@test.com")).with(csrf())).andExpect(status().isNotFound()).andExpect(jsonPath("$.message").isNotEmpty());
  mvc.perform(get("/api/admin/stats").with(user("admin@test.com").roles("ADMIN"))).andExpect(status().isOk()).andExpect(jsonPath("$.waiting").value(1));
  mvc.perform(post("/api/admin/services").with(user("admin@test.com").roles("ADMIN")).with(csrf()).contentType("application/json").content("{}")).andExpect(status().isBadRequest());
 }
}
