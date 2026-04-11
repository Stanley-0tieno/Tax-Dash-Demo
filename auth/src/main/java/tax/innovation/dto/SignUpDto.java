package tax.innovation.dto;

public class SignUpDto {
    private String company;
    private String kraPin;
    private String phone;
    private String email;
    private String password;

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
}