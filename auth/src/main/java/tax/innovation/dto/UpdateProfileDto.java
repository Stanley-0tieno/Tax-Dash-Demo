package tax.innovation.dto;

import java.time.LocalDate;

public class UpdateProfileDto {
    private String company;
    private String sector;
    private String phone;
    private String email;
    private String address;
    private String regNumber;
    private LocalDate incorporationDate;
    private Integer employees;
    private Boolean complianceCert;
    private Boolean bankDetails;

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getSector() { return sector; }
    public void setSector(String sector) { this.sector = sector; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getRegNumber() { return regNumber; }
    public void setRegNumber(String regNumber) { this.regNumber = regNumber; }

    public LocalDate getIncorporationDate() { return incorporationDate; }
    public void setIncorporationDate(LocalDate incorporationDate) { this.incorporationDate = incorporationDate; }

    public Integer getEmployees() { return employees; }
    public void setEmployees(Integer employees) { this.employees = employees; }

    public Boolean getComplianceCert() { return complianceCert; }
    public void setComplianceCert(Boolean complianceCert) { this.complianceCert = complianceCert; }

    public Boolean getBankDetails() { return bankDetails; }
    public void setBankDetails(Boolean bankDetails) { this.bankDetails = bankDetails; }
}