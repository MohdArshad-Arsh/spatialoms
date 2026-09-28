package com.oms.order.entity;

import com.oms.audit.Auditable;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ORDER_EVENTS")
public class OrderEventEntity extends Auditable {
    
    @Id
    @GeneratedValue
    private Long id;
    
    private Long orderId;
    private String statusOld;
    private String statusNew;
    private String vendor;
    private String clientName;
    private String comment;
    private double percentageCompleted;
    private String priority;
    
    private String selectedSensor;
    private Double pricePerKm;
    private Double areaCovered;
    private Double remainingArea;
    private Double totalPrice;  // pricePerKm * areaCovered
    
    private Double extraAreaCovered;
    
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getOrderId() {
        return orderId;
    }
    
    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }
    
    public String getStatusOld() {
        return statusOld;
    }
    
    public void setStatusOld(String statusOld) {
        this.statusOld = statusOld;
    }
    
    public String getStatusNew() {
        return statusNew;
    }
    
    public void setStatusNew(String statusNew) {
        this.statusNew = statusNew;
    }
    
    public String getVendor() {
        return vendor;
    }
    
    public void setVendor(String vendor) {
        this.vendor = vendor;
    }
    
    public String getClientName() {
        return clientName;
    }
    
    public void setClientName(String clientName) {
        this.clientName = clientName;
    }
    
    public String getComment() {
        return comment;
    }
    
    public void setComment(String comment) {
        this.comment = comment;
    }
    
    public double getPercentageCompleted() {
        return percentageCompleted;
    }
    
    public void setPercentageCompleted(double percentageCompleted) {
        this.percentageCompleted = percentageCompleted;
    }
    
    public String getPriority() {
        return priority;
    }
    
    public void setPriority(String priority) {
        this.priority = priority;
    }
    
    public String getSelectedSensor() {
        return selectedSensor;
    }
    
    public void setSelectedSensor(String selectedSensor) {
        this.selectedSensor = selectedSensor;
    }
    
    public Double getPricePerKm() {
        return pricePerKm;
    }
    
    public void setPricePerKm(Double pricePerKm) {
        this.pricePerKm = pricePerKm;
    }
    
    public Double getAreaCovered() {
        return areaCovered;
    }
    
    public void setAreaCovered(Double areaCovered) {
        this.areaCovered = areaCovered;
    }
    
    public Double getRemainingArea() {
        return remainingArea;
    }
    
    public void setRemainingArea(Double remainingArea) {
        this.remainingArea = remainingArea;
    }
    
    public Double getTotalPrice() {
        return totalPrice;
    }
    
    public void setTotalPrice(Double totalPrice) {
        this.totalPrice = totalPrice;
    }
    
    public Double getExtraAreaCovered() {
        return extraAreaCovered;
    }
    
    public void setExtraAreaCovered(Double extraAreaCovered) {
        this.extraAreaCovered = extraAreaCovered;
    }
}