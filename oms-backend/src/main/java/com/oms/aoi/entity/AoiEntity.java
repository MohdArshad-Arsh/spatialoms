package com.oms.aoi.entity;

import java.util.UUID;

import com.oms.audit.Auditable;
import com.oms.order.entity.OrderEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "AOI_TBL")
public class AoiEntity extends Auditable{
	
	@Id
    private Long orderId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "order_id")
    private OrderEntity order;

    private String fileOriginal;

    private String name;
    private String filePath;
    
    private double totalArea;
	
	private double remainingArea;
	
	private double percentageCompleted;
	
	
	public double getTotalArea() {
		return totalArea;
	}
	public void setTotalArea(double totalArea) {
		this.totalArea = totalArea;
	}
	public double getRemainingArea() {
		return remainingArea;
	}
	public void setRemainingArea(double remainingArea) {
		this.remainingArea = remainingArea;
	}
	public double getPercentageCompleted() {
		return percentageCompleted;
	}
	public void setPercentageCompleted(double percentageCompleted) {
		this.percentageCompleted = percentageCompleted;
	}
	public Long getOrderId() {
		return orderId;
	}
	public void setOrderId(Long orderId) {
		this.orderId = orderId;
	}
	public OrderEntity getOrder() {
		return order;
	}
	public void setOrder(OrderEntity order) {
		this.order = order;
	}
	
	public String getFileOriginal() {
		return fileOriginal;
	}
	public void setFileOriginal(String fileOriginal) {
		this.fileOriginal = fileOriginal;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getFilePath() {
		return filePath;
	}
	public void setFilePath(String filePath) {
		this.filePath = filePath;
	}
    
}
