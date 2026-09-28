package com.oms.order.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.exc.StreamReadException;
import com.fasterxml.jackson.databind.DatabindException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oms.aoi.entity.AoiEntity;
import com.oms.aoi.entity.AoiResponse;
import com.oms.aoi.repository.AoiRepository;
import com.oms.client.entity.ClientEntity;
import com.oms.client.repository.ClientRepository;
import com.oms.order.dto.OrderRequest;
import com.oms.order.dto.OrderResponse;
import com.oms.order.entity.OrderEntity;
import com.oms.order.entity.OrderEventEntity;
import com.oms.order.repository.OrderEventRepository;
import com.oms.order.repository.OrderRepository;
import com.oms.order.service.OrderService;
import com.oms.order.status.OrderStatus;
import com.oms.user.Role;
import com.oms.vendor.dto.VendorDto;
import com.oms.vendor.entity.VendorEntity;
import com.oms.vendor.service.VendorService;



@RestController
@RequestMapping("/order")
@CrossOrigin("*")
//@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class OrderController {
	
	  @Autowired
	  OrderService orderService;
	  
	  @Autowired
	  OrderRepository orderRepository;
	  
	  @Autowired
	  OrderEventRepository orderEventRepository;
	  
	  @Autowired
	  AoiRepository aoiRepository;
	  
	  @Autowired
	  VendorService vendorService;
	  
	  @Autowired
	  ClientRepository clientRepository;
	  
	  

	
//	 @PostMapping(
//			    value="/createOrder",
//			    consumes = { MediaType.MULTIPART_FORM_DATA_VALUE }
//			)
//			public ResponseEntity<String> createOrder(
//			        @RequestPart("req") OrderRequest req,
//			        @RequestPart("file") MultipartFile file) {
//
//			    try {
//			        orderService.createOrder(req, file);
//			        return ResponseEntity.ok("Order created successfully");
//			    } catch (Exception e) {
//			        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//			                .body("Failed to create order: " + e.getMessage());
//			    }
//			}
//	 
	  @PreAuthorize("hasAnyRole('MANAGER', 'OPERATOR')")
	  @PostMapping(
			    value = "/createOrder",
			    consumes = MediaType.MULTIPART_FORM_DATA_VALUE
			)
			public ResponseEntity<String> createOrder(
			        @RequestPart("req") OrderRequest req,
			        @RequestPart(value = "file", required = false) MultipartFile file) {
			    try {
			        orderService.createOrder(req, file);
			        return ResponseEntity.ok("Order created successfully");
			    } catch (Exception e) {
			        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
			                .body("Failed to create order: " + e.getMessage());
			    }
			}

	
	@PreAuthorize("hasAnyRole('MANAGER', 'OPERATOR')")
	@GetMapping("/aoi/{orderId}")
	public ResponseEntity<?> getAoiByOrderId(@PathVariable Long orderId) {
	    try {
	        return ResponseEntity.ok(orderService.getAoiByOrderId(orderId));
	    } catch (Exception e) {
	        return ResponseEntity.status(500).body("Error: " + e.getMessage());
	    }
	}
	    
	   @PreAuthorize("hasAnyRole('MANAGER', 'OPERATOR')")
	    @PutMapping("/updateStatus/{orderId}/{status}/{area}")
	    public ResponseEntity<?> updateOrderStatus(
	            @PathVariable Long orderId,
	            @PathVariable String status,
	            @RequestParam double area,
	            @RequestParam String comment,
	            @RequestParam(required = false) String selectedSensor,
	            @RequestParam(required = false) Double pricePerKm){

	        try {
	            orderService.updateOrderStatus(orderId, status, area, comment, selectedSensor, pricePerKm);
	            return ResponseEntity.ok("Order status updated to " + status);
	        } catch (Exception e) {
	            return ResponseEntity.status(500).body("Error: " + e.getMessage());
	        }
	    }
	    
	   @PreAuthorize("hasAnyRole('MANAGER', 'OPERATOR')")
	    @GetMapping("/getAllOrder")
	    public ResponseEntity<List<OrderResponse>> getAllOrder() throws StreamReadException, DatabindException, IOException{
	    	List<OrderEntity> orderList= orderRepository.findAllOrder();
	    	List<OrderResponse> orderResponseList=new ArrayList<>();

	    	for(OrderEntity order:orderList) {
	    		OrderResponse orderResponse=new OrderResponse();
//	    		BeanUtils.copyProperties(order, orderResponse);
	    		orderResponse.setId(order.getId());
	    		orderResponse.setStatus(order.getStatus().toString());
	    		orderResponse.setClientName(order.getClientName());
	    		orderResponse.setPriority(order.getPriority());
	    		orderResponse.setPoId(order.getPoId());
	    		orderResponse.setCreatedBy(order.getCreatedBy());
	    		orderResponse.setCreatedDate(order.getCreatedDate());
	    		orderResponse.setLastModifiedBy(order.getLastModifiedBy());
	    		orderResponse.setOrderType(order.getOrderType());
	    		orderResponse.setOrganization_type(order.getOrganization_type());
	    		orderResponse.setOrganization(order.getOrganization());
	    		orderResponse.setLastModifiedDate(order.getLastModifiedDate());
	    		orderResponse.setPrice(order.getPrice());
	    		orderResponse.setContactNumber(order.getContactNumber());
	    		orderResponse.setContactPerson(order.getContactPerson());
	    		orderResponse.setEmail(order.getEmail());
	    		Optional<AoiEntity> aoiEntity=Optional.ofNullable(order.getAoi());
	    		if(aoiEntity.isPresent()) {
	    			orderResponse.setTotalArea(aoiEntity.get().getTotalArea());
	    			orderResponse.setPercentageCompleted(aoiEntity.get().getPercentageCompleted());
	    			orderResponse.setRemainingArea(aoiEntity.get().getRemainingArea());
//	    			Object obj=orderService.getAoiByOrderId(order.getId());
//	    			orderResponse.setAoi(obj);
	    			VendorEntity vendorDto=order.getVendor();
	    			if(vendorDto!=null) {
	    				orderResponse.setVendorNo(vendorDto.getName());
//	    				orderResponse.setSansor(vendorDto.getSensors());
	    				List<String> strList=vendorDto.getSensors().stream().map(data->data.getName().toString()).collect(Collectors.toList());
	    				orderResponse.setSansor(strList);
	    			}
	    		}
	    		orderResponseList.add(orderResponse);
	    	}
	    	
	    	return ResponseEntity.ok(orderResponseList);
	    }
	   
	   //@PreAuthorize("hasRole('MANAGER')")
	   @PreAuthorize("hasAnyRole('MANAGER', 'OPERATOR')")
	    @GetMapping("/getAllCreatedOrder")
	    public ResponseEntity<List<OrderResponse>> getAllCreatedOrder() throws StreamReadException, DatabindException, IOException{
		   List<OrderEntity> orderList=orderRepository.findAllWithDetails(OrderStatus.CREATED);
	    	List<OrderResponse> orderResponseList=new ArrayList<>();

	    	for(OrderEntity order:orderList) {
	    		OrderResponse orderResponse=new OrderResponse();
//	    		BeanUtils.copyProperties(order, orderResponse);
	    		orderResponse.setId(order.getId());
	    		orderResponse.setClientName(order.getClientName());
	    		orderResponse.setStatus(order.getStatus().toString());
	    		orderResponse.setPriority(order.getPriority());
	    		orderResponse.setPoId(order.getPoId());
	    		orderResponse.setCreatedBy(order.getCreatedBy());
	    		orderResponse.setCreatedDate(order.getCreatedDate());
	    		orderResponse.setOrderType(order.getOrderType());
	    		orderResponse.setLastModifiedBy(order.getLastModifiedBy());
	    		orderResponse.setLastModifiedDate(order.getLastModifiedDate());
	    		Optional<AoiEntity> aoiEntity=Optional.ofNullable(order.getAoi());
	    		if(aoiEntity.isPresent()) {
	    			orderResponse.setTotalArea(aoiEntity.get().getTotalArea());
	    			orderResponse.setPercentageCompleted(aoiEntity.get().getPercentageCompleted());
	    			orderResponse.setRemainingArea(aoiEntity.get().getRemainingArea());
//	    			Object obj=orderService.getAoiByOrderId(order.getId());
//	    			orderResponse.setAoi(obj);
	    			VendorEntity vendorDto=order.getVendor();
	    			if(vendorDto!=null) {
	    				orderResponse.setVendorNo(vendorDto.getName());
//	    				orderResponse.setSansor(vendorDto.getSensors());
	    				List<String> strList=vendorDto.getSensors().stream().map(data->data.getName().toString()).collect(Collectors.toList());
	    				orderResponse.setSansor(strList);
	    			}
	    		}
	    		orderResponseList.add(orderResponse);
	    	}
	    	
	    	return ResponseEntity.ok(orderResponseList);
	    }
	   
	  @PreAuthorize("hasAnyRole('MANAGER', 'OPERATOR')")
	    @GetMapping("/getAllOrderHistoryBYId/{id}")
	    public ResponseEntity<List<OrderEventEntity>> getAllOrderHistory(@PathVariable Long id){
	    	List<OrderEventEntity> orderEventEntity=orderEventRepository.findByOrderId(id);
	    	if(!orderEventEntity.isEmpty()) {
	    		return ResponseEntity.ok(orderEventEntity);
	    	}
	    	return ResponseEntity.ok(new ArrayList<>());
	    }
	  
	  @GetMapping("/getAllAoi")
		public ResponseEntity<List<AoiResponse>> aoiAllAoi() {
		      return ResponseEntity.ok(orderService.aoiAllAoi());
		}
	    
	  @PreAuthorize("hasAnyRole('MANAGER', 'OPERATOR')")
	    @PutMapping("/approveOrder/{orderId}/{status}")
	    public ResponseEntity<?> updateOrderStatus(
	            @PathVariable Long orderId, @PathVariable String status,@RequestParam String orderType) {

	        try {
	            orderService.approveOrder(orderId,status,orderType);
	            return ResponseEntity.ok("Order " +orderId+ "updated");
	        } catch (Exception e) {
	            return ResponseEntity.status(500).body("Error: " + e.getMessage());
	        }
	    }
	  
	  @PreAuthorize("hasAnyRole('MANAGER', 'OPERATOR')")
	  @GetMapping("getAllClient")
	  public List<ClientEntity> getAllClient()
	  {
		  return (List<ClientEntity>) clientRepository.findAll();
	  }
}
