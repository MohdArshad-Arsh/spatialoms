package com.oms.vendor.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.oms.order.entity.OrderEntity;
import com.oms.vendor.dto.VendorDto;
import com.oms.vendor.entity.SensorEntity;
import com.oms.vendor.service.VendorService;


@RestController
@RequestMapping("/vendors")
public class VendorController {
	
	private final VendorService vendorService;

    public VendorController(VendorService vendorService) {
        this.vendorService = vendorService;
    }


    // GETVENDOR BY ID
    @PreAuthorize("hasAnyRole('MANAGER', 'OPERATOR')")
    @GetMapping("/{orderid}")
    public VendorDto assignOrder(@PathVariable Long orderid) {
        return vendorService.assignOrder(orderid);
    }


}
