package com.oms.barcode.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.oms.barcode.serviice.BarcodeServiice;

@RestController
@RequestMapping("/api/download")
@CrossOrigin("*")
public class BarcodeController {
	
	@Autowired
	private BarcodeServiice bService;
	
	@PreAuthorize("hasAnyRole('MANAGER', 'OPERATOR')")
    @PostMapping("/pdf/{poId}")
    public ResponseEntity<byte[]> downloadPDF(@PathVariable String poId) throws Exception {

        byte[] pdf = bService.generatePDF(poId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=po.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

}