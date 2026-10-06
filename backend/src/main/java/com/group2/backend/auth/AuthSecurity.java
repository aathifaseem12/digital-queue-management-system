package com.group2.backend.auth;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.*;
import org.springframework.web.cors.*;
@Configuration
public class AuthSecurity {
 @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
 @Bean UserDetailsService users(AccountRepository accounts) {
  return email -> accounts.findByEmail(email).map(a -> User.withUsername(a.email).password(a.passwordHash).roles(a.role).build())
   .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
 }
 @Bean AuthenticationManager authenticationManager(UserDetailsService users,PasswordEncoder encoder) {
  var provider=new DaoAuthenticationProvider(users); provider.setPasswordEncoder(encoder);
  return new ProviderManager(provider);
 }
 @Bean SecurityContextRepository contexts() { return new HttpSessionSecurityContextRepository(); }
 @Bean CorsConfigurationSource cors(@Value("${app.frontend-origin:http://localhost:5173}") String origin) {
  var configuration=new CorsConfiguration();
  configuration.setAllowedOrigins(List.of(origin));
  configuration.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
  configuration.setAllowedHeaders(List.of("Content-Type","X-CSRF-TOKEN"));
  configuration.setAllowCredentials(true);
  var source=new UrlBasedCorsConfigurationSource(); source.registerCorsConfiguration("/api/**",configuration);
  return source;
 }
 @Bean SecurityFilterChain security(HttpSecurity http,SecurityContextRepository contexts, @org.springframework.beans.factory.annotation.Qualifier("cors") CorsConfigurationSource corsConfiguration) throws Exception {
  http.cors(cors -> cors.configurationSource(corsConfiguration)).securityContext(c -> c.securityContextRepository(contexts))
   .authorizeHttpRequests(a -> a.requestMatchers("/api/auth/csrf","/api/auth/register","/api/auth/login","/error").permitAll()
    .requestMatchers("/api/admin/**").hasRole("ADMIN").anyRequest().authenticated())
   .requestCache(c -> c.disable())
   .exceptionHandling(e -> e.authenticationEntryPoint((request,response,ex) -> {
    response.setStatus(401); response.setContentType("application/json"); response.getWriter().write("{\"message\":\"Sign in to continue.\"}");
   }).accessDeniedHandler((request,response,ex) -> {
    response.setStatus(403); response.setContentType("application/json"); response.getWriter().write("{\"message\":\"Access denied or expired security token.\"}");
   }))
   .logout(l -> l.logoutUrl("/api/auth/logout").logoutSuccessHandler((request,response,authentication) -> response.setStatus(204)));
  return http.build();
 }
}
