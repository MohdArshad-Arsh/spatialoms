package com.oms.aoi.entity;

import java.time.LocalDateTime;
import java.util.List;

public class AoiResponse {
	
	private Long orderId;
	private String poId;
	private String clientName;
	private String vendorNo;
	private String priority;
	private String status;
	private String orderType;

    private LocalDateTime createdDate;
    
    private String organization_type;
	private String organization;

    private LocalDateTime lastModifiedDate;

    private String createdBy;

    private String lastModifiedBy;
	private List<String> sansor;

	
	private Object abj;
	
	
	
	
	public Long getOrderId() {
		return orderId;
	}

	public void setOrderId(Long orderId) {
		this.orderId = orderId;
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

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getOrderType() {
		return orderType;
	}

	public void setOrderType(String orderType) {
		this.orderType = orderType;
	}

	public LocalDateTime getCreatedDate() {
		return createdDate;
	}

	public void setCreatedDate(LocalDateTime createdDate) {
		this.createdDate = createdDate;
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

	public List<String> getSansor() {
		return sansor;
	}

	public void setSansor(List<String> sansor) {
		this.sansor = sansor;
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
 
	public Object getAbj() {
		return abj;
	}
 
	public void setAbj(Object abj) {
		this.abj = abj;
	}
}

 