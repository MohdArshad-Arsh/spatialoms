package com.oms.order.service;

import java.io.IOException;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.exc.StreamReadException;
import com.fasterxml.jackson.databind.DatabindException;
import com.oms.aoi.entity.AoiResponse;
import com.oms.order.dto.OrderRequest;

public interface OrderService {

//	void createOrder(OrderRequest req,MultipartFile file) throws JsonProcessingException, IOException;

	void createOrder(OrderRequest req,MultipartFile file) throws JsonProcessingException, IOException;

//	void createOrderOld(OrderRequest req, MultipartFile file) throws IOException;

	Object getAoiByOrderId(Long orderId) throws StreamReadException, DatabindException, IOException;

	void updateOrderStatus(Long orderId, String status, double area, String comment, String selectedSensor, Double pricePerKm);
	void approveOrder(Long orderId);

	List<AoiResponse> aoiAllAoi();

	void approveOrder(Long orderId, String status,String orderType);

}
