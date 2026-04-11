package tax.innovation.dto;

import java.time.LocalDate;

public class CompanyProfileDto {

    private String name;
    private String sector;
    private String kraPin;
    private String regNumber;
    private String email;
    private String phone;
    private String address;
    private LocalDate incorporationDate;
    private Integer employees;
    private String logo;
    private Boolean complianceCert;
    private Boolean bankDetails;
    private Integer profileCompletion;

    public CompanyProfileDto() {}

    // ── Getters & Setters ──────────────────────────────────────────

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSector() { return sector; }
    public void setSector(String sector) { this.sector = sector; }

    public String getKraPin() { return kraPin; }
    public void setKraPin(String kraPin) { this.kraPin = kraPin; }

    public String getRegNumber() { return regNumber; }
    public void setRegNumber(String regNumber) { this.regNumber = regNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public LocalDate getIncorporationDate() { return incorporationDate; }
    public void setIncorporationDate(LocalDate incorporationDate) { this.incorporationDate = incorporationDate; }

    public Integer getEmployees() { return employees; }
    public void setEmployees(Integer employees) { this.employees = employees; }

    public String getLogo() { return logo; }
    public void setLogo(String logo) { this.logo = logo; }

    public Boolean getComplianceCert() { return complianceCert; }
    public void setComplianceCert(Boolean complianceCert) { this.complianceCert = complianceCert; }

    public Boolean getBankDetails() { return bankDetails; }
    public void setBankDetails(Boolean bankDetails) { this.bankDetails = bankDetails; }

    public Integer getProfileCompletion() { return profileCompletion; }
    public void setProfileCompletion(Integer profileCompletion) { this.profileCompletion = profileCompletion; }

    // ── Builder (replaces @Builder) ────────────────────────────────

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final CompanyProfileDto dto = new CompanyProfileDto();

        public Builder name(String v) { dto.name = v; return this; }
        public Builder sector(String v) { dto.sector = v; return this; }
        public Builder kraPin(String v) { dto.kraPin = v; return this; }
        public Builder regNumber(String v) { dto.regNumber = v; return this; }
        public Builder email(String v) { dto.email = v; return this; }
        public Builder phone(String v) { dto.phone = v; return this; }
        public Builder address(String v) { dto.address = v; return this; }
        public Builder incorporationDate(LocalDate v) { dto.incorporationDate = v; return this; }
        public Builder employees(Integer v) { dto.employees = v; return this; }
        public Builder logo(String v) { dto.logo = v; return this; }
        public Builder complianceCert(Boolean v) { dto.complianceCert = v; return this; }
        public Builder bankDetails(Boolean v) { dto.bankDetails = v; return this; }
        public Builder profileCompletion(Integer v) { dto.profileCompletion = v; return this; }
        public CompanyProfileDto build() { return dto; }
    }
}