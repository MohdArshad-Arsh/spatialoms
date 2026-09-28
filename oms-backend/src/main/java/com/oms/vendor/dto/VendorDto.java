package com.oms.vendor.dto;

import java.util.List;

import com.oms.vendor.entity.SensorEntity;


public class VendorDto {
	
	private String name;
    
    private List<SensorEntity> sensors;

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public List<SensorEntity> getSensors() {
		return sensors;
	}

	public void setSensors(List<SensorEntity> sensors) {
		this.sensors = sensors;
	}
    
    
}
