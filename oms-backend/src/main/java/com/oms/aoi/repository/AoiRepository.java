package com.oms.aoi.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.oms.aoi.entity.AoiEntity;

public interface AoiRepository extends CrudRepository<AoiEntity, Long>{
	Optional<AoiEntity> findByOrderId(Long id);
	
	@Query("SELECT a FROM AoiEntity a " +
		       "JOIN FETCH a.order o " +
		       "LEFT JOIN FETCH o.vendor v " +
		       "LEFT JOIN FETCH v.sensors")
	List<AoiEntity> findAllWithDetails();
}
