package com.oms.barcode.serviice;
import java.io.ByteArrayOutputStream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.client.j2se.MatrixToImageWriter;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.oms.order.entity.OrderEntity;
import com.oms.order.repository.OrderRepository;

@Service
public class BarcodeServiceImpl implements BarcodeServiice{
	
	@Autowired
	OrderRepository orderRepository;
	
	public byte[] generatePDF(String poId) throws Exception {

        OrderEntity dto = orderRepository.findByPoId(poId);

        if (dto == null) {
            throw new RuntimeException("PO not found");
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();

        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, out);

        document.open();

        // 🔹 Title (Centered)
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD);
        Paragraph title = new Paragraph("Purchase Order Details", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        document.add(new Paragraph(" "));

        // 🔹 Bold Single Line (LEFT)
        Font boldFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);

        String line = "PO ID: " + dto.getPoId() +
                "   |   Client Name: " + dto.getClientName() +
                "   |   Order Type: " + (dto.getOrderType() != null ? dto.getOrderType() : "N/A") +
                "   |   Organization Type: " + (dto.getOrganization_type() != null ? dto.getOrganization_type() : "N/A") +
                "   |   Organization: " + (dto.getOrganization() != null ? dto.getOrganization() : "N/A");

        Paragraph singleLine = new Paragraph(line, boldFont);
        singleLine.setAlignment(Element.ALIGN_LEFT);
        document.add(singleLine);

        document.add(new Paragraph(" "));

        // 🔹 Barcode (CENTER + BIG)
        byte[] barcode = generateBarcodeImage(poId);
        Image image = Image.getInstance(barcode);

        image.scaleToFit(400, 150);
        image.setAlignment(Element.ALIGN_CENTER);

        document.add(image);

        document.close();

        return out.toByteArray();
    }
	
	public byte[] generateBarcodeImage(String text) throws Exception {
	    BitMatrix matrix = new MultiFormatWriter().encode(
	            text,
	            BarcodeFormat.CODE_128,
	            300,
	            100
	    );

	    ByteArrayOutputStream baos = new ByteArrayOutputStream();
	    MatrixToImageWriter.writeToStream(matrix, "PNG", baos);

	    return baos.toByteArray();
	}
}
