package com.oms.barcode.serviice;

public interface BarcodeServiice {

	byte[] generatePDF(String poId) throws Exception;

}
