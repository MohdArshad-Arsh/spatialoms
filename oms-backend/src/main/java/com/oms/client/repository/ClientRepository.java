package com.oms.client.repository;

import org.springframework.data.repository.CrudRepository;

import com.oms.client.entity.ClientEntity;

public interface ClientRepository extends CrudRepository<ClientEntity, Long>{
	ClientEntity findByClientName(String clientName);
}
