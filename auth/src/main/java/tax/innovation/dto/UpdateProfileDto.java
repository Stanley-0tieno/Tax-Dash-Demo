package tax.innovation.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
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
}