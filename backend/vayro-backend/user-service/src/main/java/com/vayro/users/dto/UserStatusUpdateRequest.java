package com.vayro.users.dto;

public class UserStatusUpdateRequest {

    private Boolean enabled;
    private String status;

    public UserStatusUpdateRequest() {
    }

    public UserStatusUpdateRequest(Boolean enabled, String status) {
        this.enabled = enabled;
        this.status = status;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean resolveEnabled() {
        if (enabled != null) {
            return enabled;
        }
        if (status != null) {
            return "ACTIVE".equalsIgnoreCase(status);
        }
        return true;
    }
}
