package com.oms.user.service;

import org.springframework.security.core.userdetails.UserDetails;

public interface UserDetailService {
	UserDetails loadUserByUsername(String str);
}
