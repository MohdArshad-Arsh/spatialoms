package com.oms.vendor.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.oms.exception.ResourceNotFoundException;
import com.oms.vendor.dto.VendorDto;
import com.oms.vendor.entity.SensorEntity;
import com.oms.vendor.entity.VendorEntity;
import com.oms.vendor.repository.SensorRepository;
import com.oms.vendor.repository.VendorRepository;
import com.oms.vendor.service.VendorService;

@Service
public class VendorServiceImpl implements VendorService{
	
	@Autowired
	VendorRepository vendorRepository;
	
	@Autowired
	SensorRepository sensorRepository;
	
	@Override
	public VendorDto assignOrder(Long orderid) {
		if(orderid!=null && orderid!=0) {
			VendorDto vendorDto=new VendorDto();
			
			VendorEntity vendorEntity=vendorRepository.findAllByOrder_Id(orderid);
			vendorDto.setName(vendorEntity.getName());
			List<SensorEntity> sensorList=sensorRepository.findByVendorId(vendorEntity.getId());
			vendorDto.setName(vendorEntity.getName());
			vendorDto.setSensors(sensorList);
			return vendorDto;
		}else {
			throw new ResourceNotFoundException("Order not present !.");
		}
		
	}

}
