package com.oms.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.oms.jwt.JwtUtil;
import com.oms.user.UserEntity;
import com.oms.user.repository.UserRepository;
import com.oms.user.service.UserDetailsServiceImpl;

@RestController
@RequestMapping("/auth")
@CrossOrigin("*")
public class AuthController {

	@Autowired
	private UserDetailsServiceImpl userDetailsService;

	@Autowired
	private AuthenticationManager authenticationManager;

	@Autowired
	private JwtUtil jwtUtil;

	@Autowired
	UserRepository repo;

	@Autowired
	private PasswordEncoder encoder;

	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody AuthRequest request) {

		try {
			Authentication auth = authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

			UserDetails user = userDetailsService.loadUserByUsername(request.getUsername());

			String token = jwtUtil.generateToken(user);

			return ResponseEntity.ok(new AuthResponse(token));

		} catch (BadCredentialsException ex) {
			throw new RuntimeException("Invalid username or password");
		}
	}

	@PostMapping("/signup")
	public ResponseEntity<?> signup(@RequestBody SignupRequest request) {

		if (repo.findByUsername(request.username).isPresent()) {
			return ResponseEntity.badRequest().body("Username already exists");
		}

		UserEntity u = new UserEntity();
		u.setUsername(request.username);
		u.setPassword(encoder.encode(request.password));
		u.setRole(request.role);

		repo.save(u);

		return ResponseEntity.ok("User created successfully");
	}

}
