package tax.innovation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyProfileDto {
    
    // Basic company info
    private String name;
    private String sector;
    private String kraPin;
    private String regNumber;
    
    // Contact info
    private String email;
    private String phone;
    private String address;
    
    // Registration info
    private LocalDate incorporationDate;
    private Integer employees;
    
    // Media
    private String logo;
    
    // Completion status
    private Boolean complianceCert;
    private Boolean bankDetails;
    private Integer profileCompletion;
}