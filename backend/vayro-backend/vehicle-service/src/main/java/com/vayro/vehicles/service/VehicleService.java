package com.vayro.vehicles.service;

import com.vayro.vehicles.dto.*;
import com.vayro.vehicles.entity.Vehicle;
import com.vayro.vehicles.entity.VehicleCategory;
import com.vayro.vehicles.entity.VehicleStatus;
import com.vayro.vehicles.exception.DuplicateVehicleException;
import com.vayro.vehicles.exception.VehicleNotFoundException;
import com.vayro.vehicles.repository.VehicleRepository;
import com.vayro.vehicles.specification.VehicleSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vayro.vehicles.entity.MaintenanceStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.time.LocalDate;

@Service
public class VehicleService {

    private static final Logger log = LoggerFactory.getLogger(VehicleService.class);

    private final VehicleRepository vehicleRepository;

    public VehicleService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<VehicleResponse> getVehicles(
            VehicleCategory category,
            VehicleStatus status,
            String vehicleType,
            String search,
            Double minPrice,
            Double maxPrice,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        // Enforce safe page bounds
        int boundedPage = Math.max(0, page);
        int boundedSize = Math.min(100, Math.max(1, size));

        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortProperty = (sortBy == null || sortBy.isBlank()) ? "name" : sortBy;
        Pageable pageable = PageRequest.of(boundedPage, boundedSize, Sort.by(direction, sortProperty));

        Specification<Vehicle> spec = VehicleSpecifications.buildSpecification(
                category, status, vehicleType, search, minPrice, maxPrice
        );

        Page<VehicleResponse> responsePage = vehicleRepository.findAll(spec, pageable)
                .map(VehicleResponse::fromEntity);

        return PageResponse.fromPage(responsePage);
    }

    @Transactional(readOnly = true)
    public VehicleResponse getVehicleById(String id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found with ID: " + id));
        return VehicleResponse.fromEntity(vehicle);
    }

    @Transactional(readOnly = true)
    public VehicleAvailabilityResponse checkAvailability(String id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found with ID: " + id));

        boolean isAvailable = vehicle.getStatus() == VehicleStatus.AVAILABLE;
        String message = isAvailable
                ? "Vehicle is available for reservation."
                : "Vehicle is currently " + vehicle.getStatus().name().toLowerCase() + " and unavailable.";

        return new VehicleAvailabilityResponse(vehicle.getId(), vehicle.getStatus(), isAvailable, message);
    }

    @Transactional
    public VehicleResponse createVehicle(VehicleCreateRequest req) {
        if (vehicleRepository.existsById(req.getId())) {
            throw new DuplicateVehicleException("A vehicle with ID '" + req.getId() + "' already exists");
        }

        Vehicle v = new Vehicle();
        v.setId(req.getId().trim());
        v.setName(req.getName().trim());
        v.setBrand(req.getBrand().trim());
        v.setModel(req.getModel().trim());
        v.setYear(req.getYear() != null ? req.getYear() : 2024);
        v.setVehicleType(req.getVehicleType().trim().toLowerCase());
        v.setCategory(req.getCategory());
        v.setVehicleClass(req.getVehicleClass());
        v.setDescription(req.getDescription());
        v.setPricePerDay(req.getPricePerDay());
        v.setPricePerHour(req.getPricePerHour() != null ? req.getPricePerHour() : Math.round(req.getPricePerDay() / 10.0 * 100.0) / 100.0);
        v.setFuelType(req.getFuelType().trim());
        v.setTransmission(req.getTransmission().trim());
        v.setSeats(req.getSeats());
        v.setMileage(req.getMileage());
        v.setEngine(req.getEngine());
        v.setPower(req.getPower());
        v.setLocation(req.getLocation() != null ? req.getLocation().trim() : "Mumbai Fleet Hub");
        v.setStatus(req.getStatus() != null ? req.getStatus() : VehicleStatus.AVAILABLE);
        v.setMaintenanceStatus(req.getMaintenanceStatus() != null ? req.getMaintenanceStatus() : com.vayro.vehicles.entity.MaintenanceStatus.GOOD);
        v.setLastMaintenanceDate(req.getLastMaintenanceDate());
        v.setNextMaintenanceDate(req.getNextMaintenanceDate());
        v.setMaintenanceNotes(req.getMaintenanceNotes());
        v.setImage1(req.getImage1().trim());
        v.setImage2(req.getImage2().trim());

        Vehicle saved = vehicleRepository.save(v);
        return VehicleResponse.fromEntity(saved);
    }

    @Transactional
    public VehicleResponse updateVehicle(String id, VehicleUpdateRequest req) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found with ID: " + id));

        if (req.getName() != null && !req.getName().isBlank()) v.setName(req.getName().trim());
        if (req.getBrand() != null && !req.getBrand().isBlank()) v.setBrand(req.getBrand().trim());
        if (req.getModel() != null && !req.getModel().isBlank()) v.setModel(req.getModel().trim());
        if (req.getYear() != null) v.setYear(req.getYear());
        if (req.getVehicleType() != null && !req.getVehicleType().isBlank()) v.setVehicleType(req.getVehicleType().trim().toLowerCase());
        if (req.getCategory() != null) v.setCategory(req.getCategory());
        if (req.getVehicleClass() != null) v.setVehicleClass(req.getVehicleClass());
        if (req.getDescription() != null) v.setDescription(req.getDescription());
        if (req.getPricePerDay() != null) v.setPricePerDay(req.getPricePerDay());
        if (req.getPricePerHour() != null) v.setPricePerHour(req.getPricePerHour());
        if (req.getFuelType() != null && !req.getFuelType().isBlank()) v.setFuelType(req.getFuelType().trim());
        if (req.getTransmission() != null && !req.getTransmission().isBlank()) v.setTransmission(req.getTransmission().trim());
        if (req.getSeats() != null) v.setSeats(req.getSeats());
        if (req.getMileage() != null) v.setMileage(req.getMileage());
        if (req.getEngine() != null) v.setEngine(req.getEngine());
        if (req.getPower() != null) v.setPower(req.getPower());
        if (req.getLocation() != null && !req.getLocation().isBlank()) v.setLocation(req.getLocation().trim());
        if (req.getStatus() != null) v.setStatus(req.getStatus());
        if (req.getMaintenanceStatus() != null) v.setMaintenanceStatus(req.getMaintenanceStatus());
        if (req.getLastMaintenanceDate() != null) v.setLastMaintenanceDate(req.getLastMaintenanceDate());
        if (req.getNextMaintenanceDate() != null) v.setNextMaintenanceDate(req.getNextMaintenanceDate());
        if (req.getMaintenanceNotes() != null) v.setMaintenanceNotes(req.getMaintenanceNotes());
        if (req.getImage1() != null && !req.getImage1().isBlank()) v.setImage1(req.getImage1().trim());
        if (req.getImage2() != null && !req.getImage2().isBlank()) v.setImage2(req.getImage2().trim());

        Vehicle saved = vehicleRepository.save(v);
        return VehicleResponse.fromEntity(saved);
    }

    @Transactional
    public VehicleResponse updateStatus(String id, VehicleStatus status) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found with ID: " + id));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isInternalService = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_SERVICE") || a.getAuthority().equals("ROLE_SERVICE"));

        // Safeguard 1: Prevent actively rented vehicle from being made AVAILABLE directly by admin without return
        if (!isInternalService && v.getStatus() == VehicleStatus.RENTED && status == VehicleStatus.AVAILABLE) {
            throw new IllegalStateException("Cannot mark an actively rented vehicle as AVAILABLE. Return handover must be processed through booking service first.");
        }

        // Safeguard 2: If vehicle is under maintenance (IN_SERVICE), prevent direct status flip to AVAILABLE without clearing maintenance
        if (!isInternalService && v.getMaintenanceStatus() == MaintenanceStatus.IN_SERVICE && status == VehicleStatus.AVAILABLE) {
            throw new IllegalStateException("Cannot mark vehicle as AVAILABLE while maintenance status is IN_SERVICE. Vehicle must complete maintenance first.");
        }

        // Safeguard 3: Do not overwrite maintenance status during return workflow
        if (isInternalService && status == VehicleStatus.AVAILABLE && v.getMaintenanceStatus() == MaintenanceStatus.IN_SERVICE) {
            log.warn("Vehicle {} returned from booking but retained in MAINTENANCE status due to active IN_SERVICE maintenance status.", id);
            v.setStatus(VehicleStatus.MAINTENANCE);
        } else {
            v.setStatus(status);
        }

        Vehicle saved = vehicleRepository.save(v);
        return VehicleResponse.fromEntity(saved);
    }

    @Transactional
    public VehicleResponse updateMaintenance(String id, VehicleMaintenanceRequest req) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found with ID: " + id));

        // Safeguard 4: Prevent vehicle with active rental from having maintenance status modified
        if (v.getStatus() == VehicleStatus.RENTED) {
            throw new IllegalStateException("Cannot change maintenance status of actively rented vehicle. Customer return must be completed first.");
        }

        MaintenanceStatus newMaintStatus = req.getMaintenanceStatus();
        v.setMaintenanceStatus(newMaintStatus);

        if (newMaintStatus == MaintenanceStatus.IN_SERVICE) {
            v.setStatus(VehicleStatus.MAINTENANCE);
        } else if (newMaintStatus == MaintenanceStatus.GOOD) {
            if (req.getStatus() != null) {
                v.setStatus(req.getStatus());
            } else if (v.getStatus() == VehicleStatus.MAINTENANCE) {
                v.setStatus(VehicleStatus.AVAILABLE);
            }
            if (req.getLastMaintenanceDate() != null) {
                v.setLastMaintenanceDate(req.getLastMaintenanceDate());
            } else if (v.getLastMaintenanceDate() == null) {
                v.setLastMaintenanceDate(LocalDate.now());
            }
        } else if (newMaintStatus == MaintenanceStatus.DUE) {
            if (req.getStatus() != null) {
                v.setStatus(req.getStatus());
            }
        }

        if (req.getLastMaintenanceDate() != null) {
            v.setLastMaintenanceDate(req.getLastMaintenanceDate());
        }
        if (req.getNextMaintenanceDate() != null) {
            v.setNextMaintenanceDate(req.getNextMaintenanceDate());
        }
        if (req.getMaintenanceNotes() != null) {
            v.setMaintenanceNotes(req.getMaintenanceNotes());
        }

        Vehicle saved = vehicleRepository.save(v);
        log.info("Vehicle {} maintenance updated to {} (operational status: {})", id, newMaintStatus, v.getStatus());
        return VehicleResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteVehicle(String id) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new VehicleNotFoundException("Vehicle not found with ID: " + id));
        vehicleRepository.delete(v);
    }
}
