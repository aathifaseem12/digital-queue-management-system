package com.group2.backend.auth;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.junit.jupiter.api.Assertions.*;
@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class AuthIntegrationTests {
 @Autowired MockMvc mvc;
 @Autowired AccountRepository accounts;
 @Autowired PasswordEncoder encoder;
 @BeforeEach void clean() { accounts.deleteAll(); }
 String registration="{\"fullName\":\"Test Member\",\"email\":\"Member@example.com\",\"password\":\"secret123\",\"role\":\"ADMIN\"}";
 void register() throws Exception {
  mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json").content(registration))
   .andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("USER"))
   .andExpect(jsonPath("$.passwordHash").doesNotExist());
 }
 @Test void registrationNormalizesAndHashesAndRejectsDuplicate() throws Exception {
  register();
  var account=accounts.findByEmail("member@example.com").orElseThrow();
  assertNotEquals("secret123",account.passwordHash);
  assertTrue(encoder.matches("secret123",account.passwordHash));
  mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json")
   .content(registration.replace("Member@example.com","member@example.com"))).andExpect(status().isConflict());
 }
 @Test void validatesAndRequiresCsrf() throws Exception {
  mvc.perform(post("/api/auth/register").contentType("application/json").content(registration)).andExpect(status().isForbidden());
  mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json").content("{}")).andExpect(status().isBadRequest());
  mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
  mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andExpect(jsonPath("$.token").isNotEmpty());
 }
 @Test void sessionLoginRoleProtectionAndLogout() throws Exception {
  register();
  mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json")
   .content("{\"email\":\"member@example.com\",\"password\":\"wrong\"}")).andExpect(status().isUnauthorized());
  var result=mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json")
   .content("{\"email\":\"MEMBER@example.com\",\"password\":\"secret123\"}"))
   .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("USER")).andReturn();
  var session=(MockHttpSession)result.getRequest().getSession(false);
  mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.email").value("member@example.com"));
  mvc.perform(get("/api/admin/probe").session(session)).andExpect(status().isForbidden());
  mvc.perform(post("/api/auth/logout").session(session).with(csrf())).andExpect(status().isNoContent());
  assertTrue(session.isInvalid());
  mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
 }
 @Test void browserCsrfTokenWorksAndRotatesAtLogin() throws Exception {
  var initial=mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
  var session=(MockHttpSession)initial.getRequest().getSession(false);
  String token=com.jayway.jsonpath.JsonPath.read(initial.getResponse().getContentAsString(),"$.token");
  mvc.perform(post("/api/auth/register").session(session).header("X-CSRF-TOKEN",token)
   .contentType("application/json").content(registration)).andExpect(status().isCreated());
  mvc.perform(post("/api/auth/login").session(session).header("X-CSRF-TOKEN",token)
   .contentType("application/json").content("{\"email\":\"member@example.com\",\"password\":\"secret123\"}")).andExpect(status().isOk());
  mvc.perform(post("/api/auth/logout").session(session).header("X-CSRF-TOKEN",token)).andExpect(status().isForbidden());
  var fresh=mvc.perform(get("/api/auth/csrf").session(session)).andExpect(status().isOk()).andReturn();
  String next=com.jayway.jsonpath.JsonPath.read(fresh.getResponse().getContentAsString(),"$.token");
  mvc.perform(post("/api/auth/logout").session(session).header("X-CSRF-TOKEN",next)).andExpect(status().isNoContent());
 }
 @Test void allowsFrontendPreflightAndRejectsOtherOrigins() throws Exception {
  mvc.perform(options("/api/auth/login")
    .header("Origin","http://localhost:5173")
    .header("Access-Control-Request-Method","POST")
    .header("Access-Control-Request-Headers","content-type,x-csrf-token"))
   .andExpect(status().isOk())
   .andExpect(header().string("Access-Control-Allow-Origin","http://localhost:5173"))
   .andExpect(header().string("Access-Control-Allow-Credentials","true"));
  mvc.perform(options("/api/auth/login")
    .header("Origin","https://untrusted.example")
    .header("Access-Control-Request-Method","POST"))
   .andExpect(status().isForbidden());
 }
}