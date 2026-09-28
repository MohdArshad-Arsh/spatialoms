package com.oms.vendor.repository;

import org.springframework.data.repository.CrudRepository;

import com.oms.vendor.entity.VendorEntity;

public interface VendorRepository extends CrudRepository<VendorEntity, Long>{
	VendorEntity findAllByOrder_Id(Long orderId);
}
