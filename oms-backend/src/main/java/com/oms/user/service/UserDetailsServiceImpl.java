package com.oms.user.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.oms.user.UserEntity;
import com.oms.user.repository.UserRepository;

@Service
public class UserDetailsServiceImpl implements UserDetailsService{
	    @Autowired
	    private UserRepository repo;

	    @Override
	    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
	        UserEntity user = repo.findByUsername(username)
	                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

	        return org.springframework.security.core.userdetails.User
	                .withUsername(user.getUsername())
	                .password(user.getPassword())
	                .roles(user.getRole().name())
	                .build();
	    }
}
