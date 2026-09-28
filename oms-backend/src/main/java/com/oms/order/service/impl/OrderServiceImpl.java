package com.oms.order.service.impl;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.exc.StreamReadException;
import com.fasterxml.jackson.databind.DatabindException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.oms.aoi.entity.AoiEntity;
import com.oms.aoi.entity.AoiResponse;
import com.oms.aoi.repository.AoiRepository;
import com.oms.client.entity.ClientEntity;
import com.oms.client.repository.ClientRepository;
import com.oms.exception.ResourceNotFoundException;
import com.oms.order.dto.OrderRequest;
import com.oms.order.entity.OrderEntity;
import com.oms.order.entity.OrderEventEntity;
import com.oms.order.repository.OrderEventRepository;
import com.oms.order.repository.OrderRepository;
import com.oms.order.service.OrderService;
import com.oms.order.status.OrderStatus;
import com.oms.vendor.dto.VendorDto;
import com.oms.vendor.entity.SensorEntity;
import com.oms.vendor.entity.VendorEntity;
import com.oms.vendor.repository.SensorRepository;
import com.oms.vendor.repository.VendorRepository;

@Service
public class OrderServiceImpl implements OrderService {

	private static final Logger log = LoggerFactory.getLogger(OrderService.class);

	@Value("${file.upload-dir}")
	private String uploadDir;

	@Autowired
	OrderRepository orderRepository;

	@Autowired
	AoiRepository aoiRepository;

	@Autowired
	OrderEventRepository orderEventRepository;

	@Autowired
	VendorRepository vendorRepository;

	@Autowired
	SensorRepository sensorRepository;

	@Autowired
	ClientRepository clientRepository;

	@Override
	public void createOrder(OrderRequest req, MultipartFile file) throws IOException {

		Map<String, Integer> sensorMapArchive = new HashMap<>();

		sensorMapArchive.put("Sensor 1", 1);
		sensorMapArchive.put("Sensor 2", 2);
		sensorMapArchive.put("Sensor 3", 3);
		sensorMapArchive.put("Sensor 4", 4);
		sensorMapArchive.put("Sensor 5", 5);
		sensorMapArchive.put("Sensor 6", 6);
		sensorMapArchive.put("Sensor 7", 7);
		sensorMapArchive.put("Sensor 8", 8);
		sensorMapArchive.put("Sensor 9", 9);
		sensorMapArchive.put("Sensor 10", 10);
		sensorMapArchive.put("Sensor 11", 11);
		sensorMapArchive.put("Sensor 12", 12);
		sensorMapArchive.put("Sensor 13", 13);
		sensorMapArchive.put("Sensor 14", 14);
		sensorMapArchive.put("Sensor 15", 15);
		sensorMapArchive.put("Sensor 16", 16);
		sensorMapArchive.put("Sensor 17", 17);
		sensorMapArchive.put("Sensor 18", 18);
		sensorMapArchive.put("Sensor 19", 19);
		sensorMapArchive.put("Sensor 20", 20);

		Map<String, Integer> sensorMapTasking = new HashMap<>();

		sensorMapTasking.put("Sensor 1", 21);
		sensorMapTasking.put("Sensor 2", 22);
		sensorMapTasking.put("Sensor 3", 23);
		sensorMapTasking.put("Sensor 4", 24);
		sensorMapTasking.put("Sensor 5", 25);
		sensorMapTasking.put("Sensor 6", 26);
		sensorMapTasking.put("Sensor 7", 27);
		sensorMapTasking.put("Sensor 8", 28);
		sensorMapTasking.put("Sensor 9", 29);
		sensorMapTasking.put("Sensor 10", 30);
		sensorMapTasking.put("Sensor 11", 31);
		sensorMapTasking.put("Sensor 12", 32);
		sensorMapTasking.put("Sensor 13", 33);
		sensorMapTasking.put("Sensor 14", 34);
		sensorMapTasking.put("Sensor 15", 35);
		sensorMapTasking.put("Sensor 16", 36);
		sensorMapTasking.put("Sensor 17", 37);
		sensorMapTasking.put("Sensor 18", 38);
		sensorMapTasking.put("Sensor 19", 39);
		sensorMapTasking.put("Sensor 20", 40);

		if (req != null) {
			if (req.getAoi() == null || req.getAoi().isEmpty()) {
				throw new ResourceNotFoundException("GeoJSON missing.");
			}
			if (req.getVendorNo() == null || req.getSansor().isEmpty()) {
				throw new ResourceNotFoundException("Vendor missing.");
			}
			OrderEntity order = new OrderEntity();
			String base = req.getPoId();
			String resultPO;

//	        order.setPrice(0.0); 
			Double price = 0.0;

			do {
				int random = new Random().nextInt(10000); // 0–9999
				resultPO = base + "_" + random;
			} while (orderRepository.findByPoId(resultPO) != null);

			if (req.getClientName() != null) {
				ClientEntity client = clientRepository.findByClientName(req.getClientName());
				if (client == null) {
					ClientEntity saveClient = new ClientEntity();
					saveClient.setClientName(req.getClientName());
					clientRepository.save(saveClient);
				}
			}

			order.setPoId(resultPO);
			order.setClientName(req.getClientName());
			order.setPriority(req.getPriority());
			order.setStatus(OrderStatus.CREATED);
			order.setOrderType(req.getOrderType());
			order.setOrganization_type(req.getOrganization_type());
			order.setOrganization(req.getOrganization());
			order.setContactNumber(req.getContactNumber());
			order.setContactPerson(req.getContactPerson());
			order.setEmail(req.getEmail());

			OrderEntity orderSaved = orderRepository.save(order);

			AoiEntity aoi = new AoiEntity();

			if (file != null && !file.isEmpty()) {

				String uploadFolder = uploadDir + "/shp-uploads/";
				File dir = new File(uploadFolder);
				if (!dir.exists())
					dir.mkdirs();

				// Original uploaded filename
				String originalName = file.getOriginalFilename();

				// Create stored filename: POID_timestamp.ext
				String ext = originalName.substring(originalName.lastIndexOf("."));
				String storedFileName = resultPO + "_" + System.currentTimeMillis() + ext;

				File savedFile = new File(dir, storedFileName);
				file.transferTo(savedFile); // save file to disk

				aoi.setFileOriginal(originalName); // <== original file name
				aoi.setName(storedFileName);
			}

			// Folder where AOIs will be saved
			String folderPath = uploadDir;
			File folder = new File(folderPath);
			if (!folder.exists())
				folder.mkdirs();

			// Create unique file name
			String fileName = "aoi_" + order.getId() + "_" + System.currentTimeMillis() + ".geojson";
			File file1 = new File(folder, fileName);

			// Write GeoJSON into file
			ObjectMapper mapper = new ObjectMapper();
			mapper.writerWithDefaultPrettyPrinter().writeValue(file1, req.getAoi());

			// Save AOI ENTITY only with file path
			aoi.setOrder(order);
			aoi.setFilePath(file1.getAbsolutePath());
			aoi.setTotalArea(req.getTotalArea());
			aoi.setRemainingArea(req.getTotalArea());
			aoi.setPercentageCompleted(0);

			aoiRepository.save(aoi);

			if (!req.getSansor().isEmpty()) {
				VendorEntity vEntity = new VendorEntity();
				vEntity.setName(req.getVendorNo());
				vEntity.setOrder(order);

				List<SensorEntity> sansorList = new ArrayList<>();

				int size = req.getSansor().size();
				Double areaDivide = req.getTotalArea() / size;

				for (String s : req.getSansor()) {
					SensorEntity sensor = new SensorEntity();
					sensor.setName(s);
					sensor.setVendor(vEntity);
					sansorList.add(sensor);

					// add price accoriding to sensor-faisal
//					if (req.getOrderType().equals("Archiving")) {
//						double ans = areaDivide * sensorMapArchive.get(s);
//						price = price + ans;
//					} else if (req.getOrderType().equals("Tasking")) {
//						double ans = areaDivide * sensorMapTasking.get(s);
//						price = price + ans;
//					} else {
//						price = 0.0;
//					}

				}
				order.setPrice(price);

				vEntity.setSensors(sansorList);
				vendorRepository.save(vEntity);
			}

			// create history
			OrderEventEntity orderEventEntity = new OrderEventEntity();
			orderEventEntity.setOrderId(orderSaved.getId());
			orderEventEntity.setStatusOld(null);
			orderEventEntity.setPercentageCompleted(0);
			orderEventEntity.setStatusNew("CREATED");
			orderEventEntity.setVendor(req.getVendorNo());
			orderEventRepository.save(orderEventEntity);
		}
	}

	@Override
	public Object getAoiByOrderId(Long orderId) throws StreamReadException, DatabindException, IOException {
		log.info("Fetching AOI for order ID: {}", orderId);

		AoiEntity aoi = aoiRepository.findById(orderId).orElseThrow(() -> {
			log.error("AOI not found for order ID: {}", orderId);
			return new ResourceNotFoundException("AOI not found for order ID: " + orderId);
		});

		log.info("AOI found. File path: {}", aoi.getFilePath());

		File file = new File(aoi.getFilePath());

		if (!file.exists()) {
			log.error("AOI file not found on disk: {}", aoi.getFilePath());
			throw new ResourceNotFoundException("AOI file not found on disk: " + aoi.getFilePath());
		}

		ObjectMapper mapper = new ObjectMapper();
		Object result = mapper.readValue(file, Map.class);
		log.info("Successfully loaded GeoJSON from file");
		return result;
	}

	@Override
	public void updateOrderStatus(Long orderId, String status, double area, String comment, String selectedSensor,
			Double pricePerKm) {

		OrderEntity order = orderRepository.findById(orderId)
				.orElseThrow(() -> new ResourceNotFoundException("Order not found"));
		VendorEntity ven = vendorRepository.findAllByOrder_Id(order.getId());

		List<SensorEntity> listOf = sensorRepository.findByVendorId(ven.getId());

		List<SensorEntity> listOfFiltered = listOf.stream().filter(x -> x.getName().equals(selectedSensor))
				.collect(Collectors.toList());

		if (listOfFiltered.isEmpty()) {
			SensorEntity newSen = new SensorEntity();
			newSen.setName(selectedSensor);
			newSen.setVendor(ven);
			sensorRepository.save(newSen);
		}

		String oldStatus = order.getStatus().toString();

		if (oldStatus.equals("CREATED")) {
			throw new ResourceNotFoundException("Please approve this order first");
		}

		if (oldStatus.equals("CANCELLED")) {
			throw new ResourceNotFoundException("Cancelled order can not be proceed");
		}

		if (comment != null) {
			order.setComment(comment);
		}

		// Calculate and update price
		if (pricePerKm != null && pricePerKm > 0) {
			Double currentPrice = order.getPrice() != null ? order.getPrice() : 0.0;
			Double additionalPrice = pricePerKm * area;
			order.setPrice(currentPrice + additionalPrice);
		}

		try {
			OrderStatus newStatus = OrderStatus.valueOf(status.toUpperCase());
			order.setStatus(newStatus);
		} catch (IllegalArgumentException e) {
			throw new RuntimeException("Invalid status value: " + status);
		}

		Optional<AoiEntity> aoiEntity = aoiRepository.findByOrderId(order.getId());

		OrderEventEntity orderEventEntity = new OrderEventEntity();

		if (aoiEntity.isPresent()) {
			double remainingArea = aoiEntity.get().getRemainingArea() - area;
			aoiEntity.get().setRemainingArea(remainingArea);

			double totalArea = aoiEntity.get().getTotalArea();
			double usedArea = totalArea - remainingArea;
			double percentageCompleted = (usedArea / totalArea) * 100;

			aoiEntity.get().setPercentageCompleted(percentageCompleted);
			orderEventEntity.setPercentageCompleted(percentageCompleted);

			// Calculate extra area if any
			double extraArea = 0.0;
			if (remainingArea < 0) {
				extraArea = Math.abs(remainingArea);
				orderEventEntity.setExtraAreaCovered(extraArea);
			} else {
				orderEventEntity.setExtraAreaCovered(0.0);
			}

//	        // Auto-set status to COMPLETED_WITH_ENHANCEMENTS if extra area is covered
//	        if (usedArea > totalArea && status.equals("COMPLETED_WITH_ENHANCEMENTS")) {
//	            order.setStatus(OrderStatus.COMPLETED_WITH_ENHANCEMENTS);
//	            orderEventEntity.setStatusNew("COMPLETED_WITH_ENHANCEMENTS");
//	        }

			orderEventEntity.setRemainingArea(remainingArea);
			aoiRepository.save(aoiEntity.get());
		}

		orderRepository.save(order);

		// Save all details in order event
		orderEventEntity.setOrderId(order.getId());
		orderEventEntity.setComment(comment);
		orderEventEntity.setStatusOld(oldStatus);

		if (orderEventEntity.getStatusNew() == null) {
			orderEventEntity.setStatusNew(status);
		}

		orderEventEntity.setVendor(order.getVendor().getName());
		orderEventEntity.setPriority(order.getPriority());
		orderEventEntity.setClientName(order.getClientName());

		// Store sensor and pricing details
		orderEventEntity.setSelectedSensor(selectedSensor);
		orderEventEntity.setPricePerKm(pricePerKm);
		orderEventEntity.setAreaCovered(area);

		if (pricePerKm != null) {
			orderEventEntity.setTotalPrice(pricePerKm * area);
		}

		orderEventRepository.save(orderEventEntity);
	}

	@Override
	public List<AoiResponse> aoiAllAoi() {

		List<AoiEntity> aoiList = aoiRepository.findAllWithDetails();
		List<AoiResponse> ans = new ArrayList<>();

		for (AoiEntity aoi : aoiList) {

			AoiResponse aoiResponse = new AoiResponse();

			OrderEntity order = aoi.getOrder();
			VendorEntity vendor = order != null ? order.getVendor() : null;

			// Order data
			if (order != null) {
				aoiResponse.setOrderId(order.getId());
				aoiResponse.setClientName(order.getClientName());
				aoiResponse.setCreatedBy(order.getCreatedBy());
				aoiResponse.setCreatedDate(order.getCreatedDate());
				aoiResponse.setLastModifiedBy(order.getLastModifiedBy());
				aoiResponse.setLastModifiedDate(order.getLastModifiedDate());
				aoiResponse.setOrderType(order.getOrderType());
				aoiResponse.setOrganization(order.getOrganization());
				aoiResponse.setOrganization_type(order.getOrganization_type());
				aoiResponse.setPriority(order.getPriority());
				aoiResponse.setStatus(order.getStatus().toString());
				aoiResponse.setPoId(order.getPoId());
			}

			// Vendor + Sensors
			if (vendor != null && vendor.getSensors() != null) {
				aoiResponse.setVendorNo(vendor.getName());

				List<String> sensors = vendor.getSensors().stream().map(SensorEntity::getName)
						.collect(Collectors.toList());

				aoiResponse.setSansor(sensors);
			}

			// File handling (keep as it is)
			File file = new File(aoi.getFilePath());
			if (!file.exists()) {
				throw new ResourceNotFoundException("AOI file not found on disk");
			}

			ObjectMapper mapper = new ObjectMapper();
			try {
				aoiResponse.setAbj(mapper.readValue(file, Map.class));
			} catch (Exception e) {
				e.printStackTrace();
			}

			ans.add(aoiResponse);
		}

		return ans;
	}

	@Override
	public void approveOrder(Long orderId, String status, String orderType) {
		OrderEntity order = orderRepository.findById(orderId)
				.orElseThrow(() -> new ResourceNotFoundException("Order not found"));

		String username = SecurityContextHolder.getContext().getAuthentication().getName();

		OrderStatus newStatus = null;

		if (status.equals("APPROVED")) {
			newStatus = OrderStatus.PENDING;
		} else if (status.equals("REJECTED")) {
			newStatus = OrderStatus.CANCELLED;
		} else {
			throw new ResourceNotFoundException("Unknown Exception");
		}

		if (orderType != null) {
			order.setOrderType(orderType);
		}

		try {
			order.setStatus(newStatus);
		} catch (IllegalArgumentException e) {
			throw new RuntimeException("Invalid order id: " + orderId);
		}

		orderRepository.save(order);
		log.info("Order approved by:- " + username + " order id:- " + orderId);

		// Get AOI to fetch total area for remaining area column
		Optional<AoiEntity> aoiEntity = aoiRepository.findByOrderId(order.getId());

		// create history
		OrderEventEntity orderEventEntity = new OrderEventEntity();
		orderEventEntity.setOrderId(order.getId());
		orderEventEntity.setStatusOld(OrderStatus.CREATED.toString());
		orderEventEntity.setStatusNew(newStatus.toString());
		orderEventEntity.setVendor(order.getVendor().getName());
		orderEventEntity.setPriority(order.getPriority());
		orderEventEntity.setClientName(order.getClientName());

		// Set remaining area and percentage for PENDING status
		if (aoiEntity.isPresent()) {
			double totalArea = aoiEntity.get().getTotalArea();
			orderEventEntity.setRemainingArea(totalArea); // Initially, remaining = total
			orderEventEntity.setPercentageCompleted(0.0); // 0% completed initially
		}

		orderEventRepository.save(orderEventEntity);
	}

	@Override
	public void approveOrder(Long orderId) {
		// TODO Auto-generated method stub
	}
}