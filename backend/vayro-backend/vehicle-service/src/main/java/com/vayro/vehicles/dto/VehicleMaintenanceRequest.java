package com.vayro.vehicles.dto;

import com.vayro.vehicles.entity.MaintenanceStatus;
import com.vayro.vehicles.entity.VehicleStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Request payload for administrator vehicle maintenance lifecycle updates.
 */
public class VehicleMaintenanceRequest {

    @NotNull(message = "Maintenance status is required")
    private MaintenanceStatus maintenanceStatus;

    private VehicleStatus status;

    private LocalDate lastMaintenanceDate;

    private LocalDate nextMaintenanceDate;

    @Size(max = 500, message = "Maintenance notes cannot exceed 500 characters")
    private String maintenanceNotes;

    public VehicleMaintenanceRequest() {
    }

    public VehicleMaintenanceRequest(
            MaintenanceStatus maintenanceStatus,
            VehicleStatus status,
            LocalDate lastMaintenanceDate,
            LocalDate nextMaintenanceDate,
            String maintenanceNotes
    ) {
        this.maintenanceStatus = maintenanceStatus;
        this.status = status;
        this.lastMaintenanceDate = lastMaintenanceDate;
        this.nextMaintenanceDate = nextMaintenanceDate;
        this.maintenanceNotes = maintenanceNotes;
    }

    public MaintenanceStatus getMaintenanceStatus() {
        return maintenanceStatus;
    }

    public void setMaintenanceStatus(MaintenanceStatus maintenanceStatus) {
        this.maintenanceStatus = maintenanceStatus;
    }

    public VehicleStatus getStatus() {
        return status;
    }

    public void setStatus(VehicleStatus status) {
        this.status = status;
    }

    public LocalDate getLastMaintenanceDate() {
        return lastMaintenanceDate;
    }

    public void setLastMaintenanceDate(LocalDate lastMaintenanceDate) {
        this.lastMaintenanceDate = lastMaintenanceDate;
    }

    public LocalDate getNextMaintenanceDate() {
        return nextMaintenanceDate;
    }

    public void setNextMaintenanceDate(LocalDate nextMaintenanceDate) {
        this.nextMaintenanceDate = nextMaintenanceDate;
    }

    public String getMaintenanceNotes() {
        return maintenanceNotes;
    }

    public void setMaintenanceNotes(String maintenanceNotes) {
        this.maintenanceNotes = maintenanceNotes;
    }
}
