package com.group2.backend.auth;
import jakarta.persistence.*;
@Entity
@Table(name="auth_accounts", uniqueConstraints=@UniqueConstraint(name="uk_auth_email", columnNames="email"))
public class Account {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @Column(nullable=false,length=100) String fullName;
 @Column(nullable=false,length=254) String email;
 @Column(nullable=false,length=255) String passwordHash;
 @Column(nullable=false,length=10) String role="USER";
 protected Account() {}
 Account(String name,String email,String hash) { this.fullName=name; this.email=email; this.passwordHash=hash; }
}
