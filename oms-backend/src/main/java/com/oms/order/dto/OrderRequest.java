package com.oms.order.dto;

import java.util.List;
import java.util.Map;

import com.oms.aoi.entity.AoiEntity;

import jakarta.persistence.Column;

public class OrderRequest {

	private String poId;
	private String clientName;
	private String vendorNo;
	private String orderType;
	private String priority;
	private double totalArea;
	private double remainingArea;
	private String organization_type;
	private String organization;
	private String comment;
	private String contactPerson;

	private Long contactNumber;

	private String email;
	private double percentageCompleted;
	private List<String> sansor;
	private Map<String, Object> aoi;
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

	public String getPriority() {
		return priority;
	}

	public void setPriority(String priority) {
		this.priority = priority;
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

	public List<String> getSansor() {
		return sansor;
	}

	public void setSansor(List<String> sansor) {
		this.sansor = sansor;
	}

	public Map<String, Object> getAoi() {
		return aoi;
	}

	public void setAoi(Map<String, Object> aoi) {
		this.aoi = aoi;
	}

	public Double getPrice() {
		return price;
	}

	public void setPrice(Double price) {
		this.price = price;
	}

}
