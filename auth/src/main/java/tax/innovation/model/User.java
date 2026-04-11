package tax.innovation.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String company;

    @Column(unique = true, nullable = false)
    private String kraPin;

    @Column(unique = true, nullable = false)
    private String phone;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private boolean verified;

    @Column(unique = true)
    private String verificationToken;

    private String sector;

    @Column(name = "registration_number")
    private String regNumber;

    @Column(name = "incorporation_date")
    private LocalDate incorporationDate;

    @Column(name = "number_of_employees")
    private Integer employees;

    @Column(name = "company_logo_url")
    private String logoUrl;

    private String address;

    @Column(name = "compliance_cert_uploaded")
    private Boolean complianceCert = false;

    @Column(name = "bank_details_provided")
    private Boolean bankDetails = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    public User() {}

    // ── Getters & Setters ──────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getKraPin() { return kraPin; }
    public void setKraPin(String kraPin) { this.kraPin = kraPin; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }

    public String getSector() { return sector; }
    public void setSector(String sector) { this.sector = sector; }

    public String getRegNumber() { return regNumber; }
    public void setRegNumber(String regNumber) { this.regNumber = regNumber; }

    public LocalDate getIncorporationDate() { return incorporationDate; }
    public void setIncorporationDate(LocalDate incorporationDate) { this.incorporationDate = incorporationDate; }

    public Integer getEmployees() { return employees; }
    public void setEmployees(Integer employees) { this.employees = employees; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Boolean getComplianceCert() { return complianceCert; }
    public void setComplianceCert(Boolean complianceCert) { this.complianceCert = complianceCert; }

    public Boolean getBankDetails() { return bankDetails; }
    public void setBankDetails(Boolean bankDetails) { this.bankDetails = bankDetails; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }

    @Transient
    public int getProfileCompletion() {
        int completion = 60;
        if (logoUrl != null && !logoUrl.isEmpty()) completion += 10;
        if (kraPin != null && !kraPin.isEmpty()) completion += 10;
        if (complianceCert != null && complianceCert) completion += 10;
        if (bankDetails != null && bankDetails) completion += 10;
        return completion;
    }
}