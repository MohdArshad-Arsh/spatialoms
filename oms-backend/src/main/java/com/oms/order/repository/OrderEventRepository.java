package com.oms.order.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.repository.CrudRepository;

import com.oms.order.entity.OrderEventEntity;

public interface OrderEventRepository extends CrudRepository<OrderEventEntity, Long>{
	List<OrderEventEntity> findByOrderId(Long id);
}
