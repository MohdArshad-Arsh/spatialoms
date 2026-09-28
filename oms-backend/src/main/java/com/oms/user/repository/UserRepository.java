package com.oms.user.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.oms.user.UserEntity;

public interface UserRepository extends CrudRepository<UserEntity, Long>{
	Optional<UserEntity> findByUsername(String str);
}
