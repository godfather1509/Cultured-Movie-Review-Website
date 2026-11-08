package com.fullStack.Movie.payment;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

public class PaymentServiceTest {

    private PaymentService paymentService;
    private final String testKeySecret = "dummy_test_secret_for_unit_tests_12345";

    @BeforeEach
    public void setup() {
        paymentService = new PaymentService();
        ReflectionTestUtils.setField(paymentService, "keyId", "rzp_test_TxZsfEPH1tzjh2");
        ReflectionTestUtils.setField(paymentService, "keySecret", testKeySecret);
    }

    @Test
    public void testAmountLessThan100PaiseThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> {
            paymentService.createOrder(99, "INR", "receipt_1");
        });
    }

    @Test
    public void testValidHmacSha256SignatureVerification() throws Exception {
        String orderId = "order_EKwxwAgItmmXdp";
        String paymentId = "pay_29MoEsz4HyalxD";

        // Generate expected HMAC-SHA256
        String data = orderId + "|" + paymentId;
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(testKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : rawHmac) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) sb.append('0');
            sb.append(hex);
        }
        String validSignature = sb.toString();

        boolean isValid = paymentService.verifySignature(orderId, paymentId, validSignature);
        assertTrue(isValid, "Valid signature must return true");
    }

    @Test
    public void testTamperedSignatureReturnsFalse() {
        String orderId = "order_EKwxwAgItmmXdp";
        String paymentId = "pay_29MoEsz4HyalxD";
        String fakeSignature = "invalid_tampered_signature_1234567890abcdef";

        boolean isValid = paymentService.verifySignature(orderId, paymentId, fakeSignature);
        assertFalse(isValid, "Tampered signature must return false");
    }

    @Test
    public void testMissingParametersReturnsFalse() {
        assertFalse(paymentService.verifySignature(null, "pay_1", "sig_1"));
        assertFalse(paymentService.verifySignature("ord_1", null, "sig_1"));
        assertFalse(paymentService.verifySignature("ord_1", "pay_1", null));
        assertFalse(paymentService.verifySignature("", "pay_1", "sig_1"));
    }
}

