package com.fullStack.Movie.payment;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class PaymentService {

    @Value("${razorpay.key.id:${RAZORPAY_KEY_ID:rzp_test_TxZsfEPH1tzjh2}}")
    private String keyId;

    @Value("${razorpay.key.secret:${RAZORPAY_KEY_SECRET:}}")
    private String keySecret;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String getKeyId() {
        return keyId;
    }

    /**
     * Creates an order with Razorpay API (POST https://api.razorpay.com/v1/orders)
     * Request: { amount (in paise), currency, receipt }
     * Return: { order_id, amount, currency, key_id }
     */
    public Map<String, Object> createOrder(long amountInPaise, String currency, String receipt) throws Exception {
        if (amountInPaise < 100) {
            throw new IllegalArgumentException("Amount must be at least 100 paise (1 INR)");
        }

        if (currency == null || currency.isBlank()) {
            currency = "INR";
        }

        if (receipt == null || receipt.isBlank()) {
            receipt = "rcpt_" + System.currentTimeMillis();
        }

        Map<String, Object> reqBody = new HashMap<>();
        reqBody.put("amount", amountInPaise);
        reqBody.put("currency", currency);
        reqBody.put("receipt", receipt);

        String jsonPayload = objectMapper.writeValueAsString(reqBody);

        String auth = keyId + ":" + keySecret;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.razorpay.com/v1/orders"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Basic " + encodedAuth)
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 401) {
            throw new SecurityException("Authentication failed with Razorpay (401). Verify your API keys.");
        }

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new RuntimeException("Razorpay API error (" + response.statusCode() + "): " + response.body());
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> resMap = objectMapper.readValue(response.body(), Map.class);

        Map<String, Object> result = new HashMap<>();
        result.put("order_id", resMap.get("id"));
        result.put("amount", resMap.get("amount"));
        result.put("currency", resMap.get("currency"));
        result.put("key_id", keyId);
        return result;
    }

    /**
     * Verifies Razorpay payment signature using HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
     */
    public boolean verifySignature(String orderId, String paymentId, String razorpaySignature) {
        if (orderId == null || orderId.isBlank() ||
            paymentId == null || paymentId.isBlank() ||
            razorpaySignature == null || razorpaySignature.isBlank()) {
            return false;
        }

        try {
            String data = orderId + "|" + paymentId;
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hmacBytes = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hmacBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            String generatedSignature = hexString.toString();

            return MessageDigest.isEqual(
                    generatedSignature.getBytes(StandardCharsets.UTF_8),
                    razorpaySignature.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            return false;
        }
    }
}

