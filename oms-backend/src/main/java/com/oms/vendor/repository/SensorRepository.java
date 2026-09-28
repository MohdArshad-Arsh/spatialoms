package com.oms.vendor.repository;

import java.util.List;

import org.springframework.data.repository.CrudRepository;

import com.oms.vendor.entity.SensorEntity;

public interface SensorRepository extends CrudRepository<SensorEntity, Long>{
	List<SensorEntity> findByVendorId(Long vendorId);
}
