package com.oms.vendor.entity;

import java.util.List;
import java.util.UUID;

import com.oms.order.entity.OrderEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name="VENDOR_TBL")
public class VendorEntity {
	@Id
    @GeneratedValue
    private Long id;

    private String name;


    // One vendor has one order
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private OrderEntity order;

    // One vendor has many sensors
    @OneToMany(mappedBy = "vendor", cascade = CascadeType.ALL, orphanRemoval = true,fetch = FetchType.LAZY)
    private List<SensorEntity> sensors;

	

	public VendorEntity() {
		super();
		// TODO Auto-generated constructor stub
	}

	public VendorEntity(Long id, String name, OrderEntity order, List<SensorEntity> sensors) {
		super();
		this.id = id;
		this.name = name;
		this.order = order;
		this.sensors = sensors;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public OrderEntity getOrder() {
		return order;
	}

	public void setOrder(OrderEntity order) {
		this.order = order;
	}

	public List<SensorEntity> getSensors() {
		return sensors;
	}

	public void setSensors(List<SensorEntity> sensors) {
		this.sensors = sensors;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}
    
    
}
