package com.oms.order.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;

import jakarta.persistence.Column;

public class OrderResponse {
	private Long id;
	private String poId;
	private String clientName;
	private String vendorNo;
	private String priority;
	private String status;
	private String orderType;

	private LocalDateTime createdDate;

	private String organization_type;
	private String organization;

	private String comment;
	private String contactPerson;

	private Long contactNumber;

	private String email;

	private LocalDateTime lastModifiedDate;

	private String createdBy;

	private String lastModifiedBy;
	private double totalArea;
	private double remainingArea;
	private double percentageCompleted;
	private List<String> sansor;
//	private Map<String, Object> aoi;
	private Object aoi;
	private Double price;

	public String getContactPerson() {
		return contactPerson;
	}

	public void setContactPerson(String contactPerson) {
		this.contactPerson = contactPerson;
	}

	public Long getContactNumber() {
		return contactNumber;
	}

	public void setContactNumber(Long contactNumber) {
		this.contactNumber = contactNumber;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getOrganization_type() {
		return organization_type;
	}

	public void setOrganization_type(String organization_type) {
		this.organization_type = organization_type;
	}

	public String getOrganization() {
		return organization;
	}

	public void setOrganization(String organization) {
		this.organization = organization;
	}

	public String getOrderType() {
		return orderType;
	}

	public void setOrderType(String orderType) {
		this.orderType = orderType;
	}

	public String getComment() {
		return comment;
	}

	public void setComment(String comment) {
		this.comment = comment;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public LocalDateTime getCreatedDate() {
		return createdDate;
	}

	public void setCreatedDate(LocalDateTime createdDate) {
		this.createdDate = createdDate;
	}

	public LocalDateTime getLastModifiedDate() {
		return lastModifiedDate;
	}

	public void setLastModifiedDate(LocalDateTime lastModifiedDate) {
		this.lastModifiedDate = lastModifiedDate;
	}

	public String getCreatedBy() {
		return createdBy;
	}

	public void setCreatedBy(String createdBy) {
		this.createdBy = createdBy;
	}

	public String getLastModifiedBy() {
		return lastModifiedBy;
	}

	public void setLastModifiedBy(String lastModifiedBy) {
		this.lastModifiedBy = lastModifiedBy;
	}

	public String getPoId() {
		return poId;
	}

	public void setPoId(String poId) {
		this.poId = poId;
	}

	public String getClientName() {
		return clientName;
	}

	public void setClientName(String clientName) {
		this.clientName = clientName;
	}

	public String getVendorNo() {
		return vendorNo;
	}

	public void setVendorNo(String vendorNo) {
		this.vendorNo = vendorNo;
	}

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

	public void setPercentageCompleted(int percentageCompleted) {
		this.percentageCompleted = percentageCompleted;
	}

	public List<String> getSansor() {
		return sansor;
	}

	public void setSansor(List<String> sansor) {
		this.sansor = sansor;
	}

	public String getPriority() {
		return priority;
	}

	public void setPriority(String priority) {
		this.priority = priority;
	}

	public Object getAoi() {
		return aoi;
	}

	public void setAoi(Object aoi) {
		this.aoi = aoi;
	}

	public Double getPrice() {
		return price;
	}

	public void setPrice(Double price) {
		this.price = price;
	}

}
