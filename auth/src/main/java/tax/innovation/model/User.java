package tax.innovation.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // This is what we're returning as userId

    //authentication fields
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

    private boolean isVerified;

    @Column(unique = true)
    private String verificationToken;

    //profile fields
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

    // Audit fields
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    // Helper method for profile completion calculation
    @Transient
    public int getProfileCompletion() {
        int completion = 60; // Base completion
        
        if (logoUrl != null && !logoUrl.isEmpty()) completion += 10;
        if (kraPin != null && !kraPin.isEmpty()) completion += 10;
        if (complianceCert != null && complianceCert) completion += 10;
        if (bankDetails != null && bankDetails) completion += 10;
        
        return completion;
    }
}