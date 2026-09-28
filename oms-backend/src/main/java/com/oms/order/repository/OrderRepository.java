package com.oms.order.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.oms.order.entity.OrderEntity;
import com.oms.order.status.OrderStatus;

public interface OrderRepository extends JpaRepository<OrderEntity, Long>{
	public OrderEntity findByPoId(String id);
	
    List<OrderEntity> findAllByStatus(OrderStatus status);
    
    @Query("SELECT DISTINCT o FROM OrderEntity o " +
    	       "LEFT JOIN FETCH o.aoi a " +
    	       "LEFT JOIN FETCH o.vendor v " +
    	       "LEFT JOIN FETCH v.sensors " +
    	       "WHERE o.status = :status")
    	List<OrderEntity> findAllWithDetails(@Param("status") OrderStatus status);
    
    @Query("SELECT DISTINCT o FROM OrderEntity o " +
 	       "LEFT JOIN FETCH o.aoi a " +
 	       "LEFT JOIN FETCH o.vendor v " +
 	       "LEFT JOIN FETCH v.sensors ")
 	List<OrderEntity> findAllOrder();
}
