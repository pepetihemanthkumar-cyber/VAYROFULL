package com.vayro.vehicles.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vayro.vehicles.dto.VehicleCreateRequest;
import com.vayro.vehicles.dto.VehicleMaintenanceRequest;
import com.vayro.vehicles.dto.VehicleStatusRequest;
import com.vayro.vehicles.entity.MaintenanceStatus;
import com.vayro.vehicles.entity.VehicleCategory;
import com.vayro.vehicles.entity.VehicleStatus;
import com.vayro.vehicles.repository.VehicleRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class VehicleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Value("${jwt.secret}")
    private String jwtSecret;

    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        adminToken = generateTestToken("admin@vayro.com", "ADMIN");
        userToken = generateTestToken("customer@vayro.com", "USER");
        if (vehicleRepository.existsById("custom-test-car-01")) {
            vehicleRepository.deleteById("custom-test-car-01");
        }
    }

    private String generateTestToken(String email, String role) {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        SecretKey key = Keys.hmacShaKeyFor(keyBytes);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", 1L);
        claims.put("role", role);
        claims.put("name", "Test User");

        return Jwts.builder()
                .claims(claims)
                .subject(email)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key)
                .compact();
    }

    @Test
    void testGetVehiclesPublicAccessReturns200With207TotalElements() throws Exception {
        mockMvc.perform(get("/api/vehicles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(207))
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.size").value(20));
    }

    @Test
    void testGetVehiclesWithCategoryFilter() throws Exception {
        mockMvc.perform(get("/api/vehicles?category=SUV"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].category").value("SUV"));
    }

    @Test
    void testGetVehicleByIdReturns200WithExactTwoImages() throws Exception {
        mockMvc.perform(get("/api/vehicles/maruti-suzuki-swift"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("maruti-suzuki-swift"))
                .andExpect(jsonPath("$.name").value("Maruti Suzuki Swift"))
                .andExpect(jsonPath("$.images").isArray())
                .andExpect(jsonPath("$.images.length()").value(2));
    }

    @Test
    void testCheckAvailabilityReturns200() throws Exception {
        mockMvc.perform(get("/api/vehicles/maruti-suzuki-swift/availability"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vehicleId").value("maruti-suzuki-swift"))
                .andExpect(jsonPath("$.available").value(true));
    }

    @Test
    void testAdminCreateVehicleReturns201() throws Exception {
        VehicleCreateRequest req = new VehicleCreateRequest();
        req.setId("custom-test-car-01");
        req.setName("Custom Test Car");
        req.setBrand("TestBrand");
        req.setModel("TestModel");
        req.setYear(2025);
        req.setVehicleType("car");
        req.setCategory(VehicleCategory.SUV);
        req.setPricePerDay(4500.0);
        req.setFuelType("Petrol");
        req.setTransmission("Automatic");
        req.setSeats(5);
        req.setImage1("/assets/vehicles/test/front.webp");
        req.setImage2("/assets/vehicles/test/rear.webp");

        mockMvc.perform(post("/api/vehicles")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("custom-test-car-01"))
                .andExpect(jsonPath("$.name").value("Custom Test Car"));
    }

    @Test
    void testUserCannotCreateVehicleReturns403() throws Exception {
        VehicleCreateRequest req = new VehicleCreateRequest();
        req.setId("forbidden-car-01");
        req.setName("Forbidden Car");
        req.setBrand("Forbidden");
        req.setModel("Car");
        req.setVehicleType("car");
        req.setCategory(VehicleCategory.SEDAN);
        req.setPricePerDay(3000.0);
        req.setFuelType("Petrol");
        req.setTransmission("Automatic");
        req.setSeats(5);
        req.setImage1("/assets/vehicles/test/front.webp");
        req.setImage2("/assets/vehicles/test/rear.webp");

        mockMvc.perform(post("/api/vehicles")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAdminUpdateStatusReturns200() throws Exception {
        VehicleStatusRequest req = new VehicleStatusRequest(VehicleStatus.MAINTENANCE);

        mockMvc.perform(patch("/api/vehicles/maruti-suzuki-swift/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MAINTENANCE"));
    }

    @Test
    void testUserUpdateStatusReturns403() throws Exception {
        VehicleStatusRequest req = new VehicleStatusRequest(VehicleStatus.MAINTENANCE);

        mockMvc.perform(patch("/api/vehicles/maruti-suzuki-swift/status")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testInternalServiceUpdateStatusReturns200() throws Exception {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        SecretKey key = Keys.hmacShaKeyFor(keyBytes);

        String internalToken = Jwts.builder()
                .issuer("vayro-booking-service")
                .audience().add("vayro-vehicle-service").and()
                .subject("booking-service@internal.vayro.com")
                .claim("role", "INTERNAL_SERVICE")
                .claim("userId", "system")
                .claim("name", "Internal Booking Service")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 300000))
                .signWith(key)
                .compact();

        VehicleStatusRequest req = new VehicleStatusRequest(VehicleStatus.AVAILABLE);

        mockMvc.perform(patch("/api/vehicles/maruti-suzuki-swift/status")
                        .header("Authorization", "Bearer " + internalToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AVAILABLE"));
    }

    @Test
    void testUntrustedIssuerUpdateStatusReturns403() throws Exception {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        SecretKey key = Keys.hmacShaKeyFor(keyBytes);

        String untrustedToken = Jwts.builder()
                .issuer("untrusted-hacker-issuer")
                .audience().add("vayro-vehicle-service").and()
                .subject("booking-service@internal.vayro.com")
                .claim("role", "INTERNAL_SERVICE")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 300000))
                .signWith(key)
                .compact();

        VehicleStatusRequest req = new VehicleStatusRequest(VehicleStatus.AVAILABLE);

        mockMvc.perform(patch("/api/vehicles/maruti-suzuki-swift/status")
                        .header("Authorization", "Bearer " + untrustedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUntrustedAudienceUpdateStatusReturns403() throws Exception {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        SecretKey key = Keys.hmacShaKeyFor(keyBytes);

        String untrustedToken = Jwts.builder()
                .issuer("vayro-booking-service")
                .audience().add("untrusted-audience").and()
                .subject("booking-service@internal.vayro.com")
                .claim("role", "INTERNAL_SERVICE")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 300000))
                .signWith(key)
                .compact();

        VehicleStatusRequest req = new VehicleStatusRequest(VehicleStatus.AVAILABLE);

        mockMvc.perform(patch("/api/vehicles/maruti-suzuki-swift/status")
                        .header("Authorization", "Bearer " + untrustedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdateMaintenanceAsAdminSucceedsAndSetsStatusToMaintenance() throws Exception {
        VehicleMaintenanceRequest req = new VehicleMaintenanceRequest(
                MaintenanceStatus.IN_SERVICE,
                null,
                null,
                java.time.LocalDate.now().plusMonths(1),
                "Scheduled 50,000km brake rotor and fluid service"
        );

        mockMvc.perform(patch("/api/vehicles/maruti-suzuki-swift/maintenance")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maintenanceStatus").value("IN_SERVICE"))
                .andExpect(jsonPath("$.status").value("MAINTENANCE"))
                .andExpect(jsonPath("$.maintenanceNotes").value("Scheduled 50,000km brake rotor and fluid service"));

        // Transition back to GOOD restores operational status to AVAILABLE
        VehicleMaintenanceRequest completedReq = new VehicleMaintenanceRequest(
                MaintenanceStatus.GOOD,
                null,
                java.time.LocalDate.now(),
                java.time.LocalDate.now().plusMonths(6),
                "Brake service completed. Road test passed."
        );

        mockMvc.perform(patch("/api/vehicles/maruti-suzuki-swift/maintenance")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completedReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maintenanceStatus").value("GOOD"))
                .andExpect(jsonPath("$.status").value("AVAILABLE"));
    }

    @Test
    void testUpdateMaintenanceAsRegularCustomerReturns403Forbidden() throws Exception {
        VehicleMaintenanceRequest req = new VehicleMaintenanceRequest(
                MaintenanceStatus.IN_SERVICE,
                null,
                null,
                null,
                "Unauthorized customer attempt"
        );

        mockMvc.perform(patch("/api/vehicles/maruti-suzuki-swift/maintenance")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdateMaintenanceOnActivelyRentedVehicleReturns400() throws Exception {
        // Set vehicle to RENTED
        var vehicle = vehicleRepository.findById("maruti-suzuki-swift").orElseThrow();
        vehicle.setStatus(VehicleStatus.RENTED);
        vehicleRepository.save(vehicle);

        try {
            VehicleMaintenanceRequest req = new VehicleMaintenanceRequest(
                    MaintenanceStatus.IN_SERVICE,
                    null,
                    null,
                    null,
                    "Attempt maintenance on rented vehicle"
            );

            mockMvc.perform(patch("/api/vehicles/maruti-suzuki-swift/maintenance")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Cannot change maintenance status of actively rented vehicle. Customer return must be completed first."));
        } finally {
            vehicle.setStatus(VehicleStatus.AVAILABLE);
            vehicleRepository.save(vehicle);
        }
    }

    @Test
    void testReturnWorkflowDoesNotOverwriteInServiceMaintenanceStatus() throws Exception {
        var vehicle = vehicleRepository.findById("maruti-suzuki-swift").orElseThrow();
        vehicle.setStatus(VehicleStatus.MAINTENANCE);
        vehicle.setMaintenanceStatus(MaintenanceStatus.IN_SERVICE);
        vehicleRepository.save(vehicle);

        try {
            // Generate valid internal service token simulating booking-service during vehicle return
            byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
            SecretKey key = Keys.hmacShaKeyFor(keyBytes);

            String internalToken = Jwts.builder()
                    .issuer("vayro-booking-service")
                    .audience().add("vayro-vehicle-service").and()
                    .subject("booking-service@internal.vayro.com")
                    .claim("role", "INTERNAL_SERVICE")
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + 300000))
                    .signWith(key)
                    .compact();

            VehicleStatusRequest req = new VehicleStatusRequest(VehicleStatus.AVAILABLE);

            // Return request must NOT overwrite MAINTENANCE operational status
            mockMvc.perform(patch("/api/vehicles/maruti-suzuki-swift/status")
                            .header("Authorization", "Bearer " + internalToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("MAINTENANCE"))
                    .andExpect(jsonPath("$.maintenanceStatus").value("IN_SERVICE"));
        } finally {
            vehicle.setStatus(VehicleStatus.AVAILABLE);
            vehicle.setMaintenanceStatus(MaintenanceStatus.GOOD);
            vehicleRepository.save(vehicle);
        }
    }

    @Test
    void testAdminCannotDirectlyMarkRentedVehicleAsAvailableWithoutReturn() throws Exception {
        var vehicle = vehicleRepository.findById("maruti-suzuki-swift").orElseThrow();
        vehicle.setStatus(VehicleStatus.RENTED);
        vehicleRepository.save(vehicle);

        try {
            VehicleStatusRequest req = new VehicleStatusRequest(VehicleStatus.AVAILABLE);

            mockMvc.perform(patch("/api/vehicles/maruti-suzuki-swift/status")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Cannot mark an actively rented vehicle as AVAILABLE. Return handover must be processed through booking service first."));
        } finally {
            vehicle.setStatus(VehicleStatus.AVAILABLE);
            vehicleRepository.save(vehicle);
        }
    }
}
