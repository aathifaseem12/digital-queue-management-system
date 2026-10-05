package com.group2.backend.auth;
import java.util.Locale;
import java.util.Map;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
 private final AccountRepository accounts;
 private final PasswordEncoder encoder;
 private final AuthenticationManager manager;
 private final SecurityContextRepository contexts;
 public AuthController(AccountRepository accounts,PasswordEncoder encoder,AuthenticationManager manager,SecurityContextRepository contexts) {
  this.accounts=accounts; this.encoder=encoder; this.manager=manager; this.contexts=contexts;
 }
 public record Registration(@NotBlank @Size(min=3,max=100) String fullName,
  @NotBlank @Email @Size(max=254) String email,@NotBlank @Size(min=6,max=72) String password) {}
 public record Login(@NotBlank @Email @Size(max=254) String email,@NotBlank @Size(max=72) String password) {}
 public record Profile(Long id,String fullName,String email,String role) {}
 static String normalize(String email) { return email.trim().toLowerCase(Locale.ROOT); }
 static Profile profile(Account account) { return new Profile(account.id,account.fullName,account.email,account.role); }
 @GetMapping("/csrf")
 public Map<String,String> csrf(CsrfToken token) { return Map.of("token",token.getToken(),"headerName",token.getHeaderName()); }
 @PostMapping("/register")
 public ResponseEntity<Profile> register(@Valid @RequestBody Registration input) {
  if(input.fullName().trim().length()<3 || input.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72)
   throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Check your name and password length.");
  try {
   Account account=accounts.saveAndFlush(new Account(input.fullName().trim(),normalize(input.email()),encoder.encode(input.password())));
   return ResponseEntity.status(HttpStatus.CREATED).body(profile(account));
  } catch(DataIntegrityViolationException ex) {
   throw new ResponseStatusException(HttpStatus.CONFLICT,"An account with this email already exists.");
  }
 }
 @PostMapping("/login")
 public Profile login(@Valid @RequestBody Login input,HttpServletRequest request,HttpServletResponse response) {
  Authentication authentication=manager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(normalize(input.email()),input.password()));
  request.getSession();
  request.changeSessionId();
  var context=SecurityContextHolder.createEmptyContext();
  context.setAuthentication(authentication);
  SecurityContextHolder.setContext(context);
  contexts.saveContext(context,request,response);
  new HttpSessionCsrfTokenRepository().saveToken(null,request,response);
  return profile(accounts.findByEmail(authentication.getName()).orElseThrow());
 }
 @GetMapping("/me")
 public Profile me(Authentication authentication) {
  return profile(accounts.findByEmail(authentication.getName()).orElseThrow());
 }
}
